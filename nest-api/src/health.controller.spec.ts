import { HealthController } from "./health.controller";

describe("HealthController", () => {
  it("reports the Nest API as healthy", () => {
    const controller = new HealthController();

    expect(controller.getHealth()).toEqual({
      ok: true,
      service: "nest-api",
    });
  });
});
