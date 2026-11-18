// These run real programs through the local judge (needs g++, python3; java/node/gcc tests are skipped if missing).
const { test, before } = require("node:test");
const assert = require("node:assert/strict");
const { judge } = require("./helpers");
const { summarise } = require("../services/gradingService");

let langs = [];
before(async () => { langs = (await judge.languages()).map((l) => l.id); });
const has = (l) => (t) => (langs.includes(l) ? undefined : t.skip(`${l} toolchain not installed`));
const grade = async (language, code, tests, extra = {}) => summarise(await judge.grade({ language, code, tests, ...extra }));
const sum = [{ input: "1 2", expectedOutput: "3" }, { input: "10 20", expectedOutput: "30", hidden: true }];

const SOURCES = {
    cpp: '#include <iostream>\nint main(){long long a,b;std::cin>>a>>b;std::cout<<a+b<<"\\n";}',
    c: '#include <stdio.h>\nint main(){long long a,b;scanf("%lld %lld",&a,&b);printf("%lld\\n",a+b);}',
    python: "a,b=map(int,input().split())\nprint(a+b)",
    java: "import java.util.*;public class Main{public static void main(String[] x){Scanner s=new Scanner(System.in);System.out.println(s.nextLong()+s.nextLong());}}",
    javascript: 'const [a,b]=require("fs").readFileSync(0,"utf8").split(/\\s+/).map(Number);console.log(a+b);',
};
for (const [lang, code] of Object.entries(SOURCES)) {
    test(`${lang}: reads stdin and is Accepted on every case`, async (t) => {
        if (has(lang)(t)) return;
        const r = await grade(lang, code, sum);
        assert.equal(r.verdict, "Accepted");
        assert.equal(r.score, 100);
        assert.ok(r.memoryUsed > 0, "peak memory is measured");
    });
}

test("wrong answer is reported, not accepted", async (t) => {
    if (has("cpp")(t)) return;
    const r = await grade("cpp", '#include <iostream>\nint main(){std::cout<<42;}', sum);
    assert.equal(r.verdict, "Wrong Answer");
    assert.equal(r.passedCount, 0);
});

test("compile errors surface the compiler message", async (t) => {
    if (has("cpp")(t)) return;
    const r = await grade("cpp", "int main({", sum);
    assert.equal(r.verdict, "Compilation Error");
    assert.match(r.compileOutput, /error/);
});

test("runtime errors: segfault and non-zero exit", async (t) => {
    if (has("cpp")(t)) return;
    assert.equal((await grade("cpp", "int main(){int*p=0;*p=1;}", sum)).verdict, "Runtime Error");
    if (langs.includes("python")) assert.equal((await grade("python", "import sys;sys.exit(3)", sum)).verdict, "Runtime Error");
});

test("infinite loop is killed with Time Limit Exceeded", async (t) => {
    if (has("cpp")(t)) return;
    const t0 = Date.now();
    const r = await grade("cpp", "int main(){while(1);}", [sum[0]], { timeLimitMs: 500 });
    assert.equal(r.verdict, "Time Limit Exceeded");
    assert.ok(Date.now() - t0 < 5000);
});

test("huge allocation gives Memory Limit Exceeded", async (t) => {
    if (has("cpp")(t)) return;
    const r = await grade("cpp", "#include <vector>\nint main(){std::vector<char> v(2000000000,1);return v[5];}", [sum[0]], { memoryLimitMb: 64 });
    assert.equal(r.verdict, "Memory Limit Exceeded");
});

test("fork bomb is contained and cleaned up", async (t) => {
    if (has("python")(t)) return;
    const r = await grade("python", "import os\nwhile True: os.fork()", [sum[0]], { timeLimitMs: 300 });
    assert.notEqual(r.verdict, "Accepted");
    assert.ok(["Time Limit Exceeded", "Runtime Error", "Memory Limit Exceeded"].includes(r.verdict));
});

test("endless output is stopped", async (t) => {
    if (has("python")(t)) return;
    const r = await grade("python", 'while True: print("x"*1000)', [sum[0]]);
    assert.notEqual(r.verdict, "Accepted");
});

test("server secrets are not visible to submitted programs", async (t) => {
    if (has("python")(t)) return;
    const out = await judge.run({ language: "python", code: 'import os;print(os.environ.get("JWT_SECRET"), os.environ.get("MONGO_URI"))' });
    assert.equal(out.stdout.trim(), "None None");
});

test("Run uses custom stdin and returns stdout and stderr separately", async (t) => {
    if (has("python")(t)) return;
    const out = await judge.run({ language: "python", code: 'import sys\nprint(sys.stdin.read().upper())\nprint("e",file=sys.stderr)', input: "hello" });
    assert.equal(out.verdict, "Completed");
    assert.equal(out.stdout, "HELLO\n");
    assert.equal(out.stderr, "e\n");
});

test("unsupported languages are rejected and never listed", async () => {
    await assert.rejects(judge.run({ language: "cobol", code: "x" }), (e) => e.status === 400);
    assert.ok(!langs.includes("cobol"));
});
