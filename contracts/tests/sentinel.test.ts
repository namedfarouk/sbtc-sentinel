import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("sBTC Sentinel Contract", () => {

  it("should start with neutral sentiment and zero snapshots", () => {
    const result = simnet.callReadOnlyFn(
      "sentinel",
      "get-latest-sentiment",
      [],
      deployer
    );
    expect(result.result).toBeOk(
      Cl.tuple({
        score: Cl.uint(50),
        label: Cl.stringAscii("neutral"),
        "last-updated": Cl.uint(0),
        "total-snapshots": Cl.uint(0),
      })
    );
  });

  it("should allow owner to submit sentiment", () => {
    const result = simnet.callPublicFn(
      "sentinel",
      "submit-sentiment",
      [
        Cl.uint(75),
        Cl.stringAscii("greed"),
        Cl.uint(95000),
        Cl.uint(545000000),
        Cl.stringAscii("ai-analysis-v1"),
      ],
      deployer
    );
    expect(result.result).toBeOk(Cl.uint(0));
  });

  it("should block unauthorized users", () => {
    const result = simnet.callPublicFn(
      "sentinel",
      "submit-sentiment",
      [
        Cl.uint(25),
        Cl.stringAscii("fear"),
        Cl.uint(90000),
        Cl.uint(500000000),
        Cl.stringAscii("ai-analysis-v1"),
      ],
      wallet1
    );
    expect(result.result).toBeErr(Cl.uint(100));
  });

  it("should allow owner to authorize another address", () => {
    const addResult = simnet.callPublicFn(
      "sentinel",
      "add-updater",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(addResult.result).toBeOk(Cl.bool(true));

    const submitResult = simnet.callPublicFn(
      "sentinel",
      "submit-sentiment",
      [
        Cl.uint(30),
        Cl.stringAscii("fear"),
        Cl.uint(88000),
        Cl.uint(480000000),
        Cl.stringAscii("ai-analysis-v1"),
      ],
      wallet1
    );
    expect(submitResult.result).toBeOk(Cl.uint(0));
  });

  it("should reject scores above 100", () => {
    const result = simnet.callPublicFn(
      "sentinel",
      "submit-sentiment",
      [
        Cl.uint(150),
        Cl.stringAscii("extreme-greed"),
        Cl.uint(100000),
        Cl.uint(600000000),
        Cl.stringAscii("ai-analysis-v1"),
      ],
      deployer
    );
    expect(result.result).toBeErr(Cl.uint(101));
  });

});