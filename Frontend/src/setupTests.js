import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

// react-router v7 expects these Web APIs, which the Jest 27 jsdom environment bundled with CRA lacks.
global.TextEncoder = global.TextEncoder || TextEncoder;
global.TextDecoder = global.TextDecoder || TextDecoder;
