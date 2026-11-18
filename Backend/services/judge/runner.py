#!/usr/bin/env python3
"""Runs ONE command under resource limits and prints a JSON report on stdout.

Used by the judge both directly on the host (development) and inside the
locked-down container (production). It measures peak RSS via wait4(), which
is exact for the child process tree and does not depend on /usr/bin/time.
"""
import argparse, json, os, resource, signal, subprocess, sys, time


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--workdir", required=True)
    ap.add_argument("--timeout-ms", type=int, required=True)   # wall-clock kill limit
    ap.add_argument("--as-mb", type=int, default=0)            # address-space limit (0 = none)
    ap.add_argument("--out-limit", type=int, default=1 << 20)  # max bytes written to a file
    ap.add_argument("--nproc", type=int, default=0)
    ap.add_argument("--stdin", default=None)
    ap.add_argument("--stdout", required=True)
    ap.add_argument("--stderr", required=True)
    ap.add_argument("cmd", nargs=argparse.REMAINDER)
    a = ap.parse_args()
    cmd = a.cmd[1:] if a.cmd and a.cmd[0] == "--" else a.cmd

    def preexec():
        os.setsid()
        resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
        resource.setrlimit(resource.RLIMIT_FSIZE, (a.out_limit, a.out_limit))
        cpu = a.timeout_ms // 1000 + 2
        resource.setrlimit(resource.RLIMIT_CPU, (cpu, cpu + 1))
        if a.as_mb > 0:
            resource.setrlimit(resource.RLIMIT_AS, (a.as_mb << 20, a.as_mb << 20))
        if a.nproc > 0:
            resource.setrlimit(resource.RLIMIT_NPROC, (a.nproc, a.nproc))

    env = {"PATH": os.environ.get("PATH", "/usr/bin:/bin"), "HOME": a.workdir, "LANG": "C.UTF-8"}
    stdin = open(os.path.join(a.workdir, a.stdin), "rb") if a.stdin else subprocess.DEVNULL
    fo = open(os.path.join(a.workdir, a.stdout), "wb")
    fe = open(os.path.join(a.workdir, a.stderr), "wb")

    report = {"exitCode": None, "signal": None, "timedOut": False, "wallMs": 0, "cpuMs": 0, "maxRssKb": 0, "startFailed": False}
    start = time.monotonic()
    try:
        p = subprocess.Popen(cmd, cwd=a.workdir, stdin=stdin, stdout=fo, stderr=fe, env=env,
                             preexec_fn=preexec, close_fds=True)
    except OSError as e:
        report["startFailed"] = True
        fe.write(str(e).encode())
        print(json.dumps(report))
        return

    deadline = start + a.timeout_ms / 1000.0
    status = ru = None
    while True:
        pid, status, ru = os.wait4(p.pid, os.WNOHANG)
        if pid:
            break
        if time.monotonic() > deadline:
            report["timedOut"] = True
            try:
                os.killpg(p.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            _, status, ru = os.wait4(p.pid, 0)
            break
        time.sleep(0.003)

    report["wallMs"] = round((time.monotonic() - start) * 1000, 1)
    try:  # reap any stray descendants
        os.killpg(p.pid, signal.SIGKILL)
    except (ProcessLookupError, PermissionError):
        pass
    p.returncode = 0
    if os.WIFSIGNALED(status):
        report["signal"] = os.WTERMSIG(status)
    else:
        report["exitCode"] = os.WEXITSTATUS(status)
    report["cpuMs"] = round((ru.ru_utime + ru.ru_stime) * 1000, 1)
    report["maxRssKb"] = int(ru.ru_maxrss)
    print(json.dumps(report))


if __name__ == "__main__":
    main()
