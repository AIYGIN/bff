import { Test, TestingModule } from "@nestjs/testing";

import { JwtAuthGuard } from "../../guard/jwt-auth.guard";
import { EnterprisesService } from "../../service/enterprises/enterprises.service";
import { EnterprisesController } from "./enterprises.controller";

describe("EnterprisesController", () => {
  let controller: EnterprisesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnterprisesController],
      providers: [EnterprisesService],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<EnterprisesController>(EnterprisesController);
  });

  it("returns fixed enterprise quants info", () => {
    const response = controller.getQuantsInfo();

    expect(response.ranking).toHaveLength(20);
    expect(response.ranking.map((item) => item.name)).toEqual([
      "NTT",
      "KDDI",
      "ソフトバンク",
      "三菱商事",
      "伊藤忠商事",
      "三井物産",
      "住友商事",
      "丸紅",
      "三菱UFJ FG",
      "三井住友FG",
      "みずほFG",
      "東京海上HD",
      "MS&AD",
      "積水ハウス",
      "オリックス",
      "JT",
      "INPEX",
      "ENEOS HD",
      "武田薬品工業",
      "日本製鉄",
    ]);
    expect(response.ranking[0]).toMatchObject({
      name: "NTT",
      prediction: 30,
      buy: 30,
      sell: 10,
      upside: 12,
    });
    expect(response.lastUpdated).toBe("2026-06-26");
  });
});
