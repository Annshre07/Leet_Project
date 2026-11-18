// Language catalogue. A language is only offered to users when its toolchain is actually available.
const LANGUAGES = {
    cpp: {
        id: "cpp", label: "C++ (g++, C++17)", monaco: "cpp", file: "main.cpp", tools: ["g++"],
        compile: () => ["g++", "-O2", "-std=c++17", "-pipe", "-o", "main", "main.cpp"],
        run: () => ["./main"], asLimit: true, timeMultiplier: 1,
        template: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    return 0;\n}\n',
    },
    c: {
        id: "c", label: "C (gcc, C11)", monaco: "c", file: "main.c", tools: ["gcc"],
        compile: () => ["gcc", "-O2", "-std=c11", "-pipe", "-o", "main", "main.c", "-lm"],
        run: () => ["./main"], asLimit: true, timeMultiplier: 1,
        template: '#include <stdio.h>\n\nint main(void) {\n\n    return 0;\n}\n',
    },
    python: {
        id: "python", label: "Python 3", monaco: "python", file: "main.py", tools: ["python3"],
        compile: null, run: () => ["python3", "main.py"], asLimit: true, timeMultiplier: 3,
        template: 'import sys\n\n\ndef main():\n    data = sys.stdin.read().split()\n\n\nif __name__ == "__main__":\n    main()\n',
    },
    java: {
        id: "java", label: "Java (class Main)", monaco: "java", file: "Main.java", tools: ["javac", "java"],
        compile: () => ["javac", "-encoding", "UTF-8", "Main.java"],
        run: (memMb) => ["java", `-Xmx${memMb}m`, "-Xss64m", "-XX:+UseSerialGC", "-XX:TieredStopAtLevel=1", "Main"],
        asLimit: false, timeMultiplier: 3,
        template: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n\n    }\n}\n',
    },
    javascript: {
        id: "javascript", label: "JavaScript (Node.js)", monaco: "javascript", file: "main.js", tools: ["node"],
        compile: null, run: (memMb) => ["node", `--max-old-space-size=${memMb}`, "main.js"], asLimit: false, timeMultiplier: 2,
        template: "const lines = require('fs').readFileSync(0, 'utf8').split('\\n');\n\n",
    },
};

module.exports = { LANGUAGES };
