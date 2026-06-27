import { Injectable } from "@nestjs/common";

import { GetEnterpriseQuantsInfoResponseDto } from "../../dto/enterprises/get-enterprise-quants-info-response.dto";

@Injectable()
export class EnterprisesService {
  getQuantsInfo(): GetEnterpriseQuantsInfoResponseDto {
    const companies = [
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
    ];

    return new GetEnterpriseQuantsInfoResponseDto({
      ranking: companies.map((name, index) => ({
        name,
        prediction: 30 - index,
        buy: 30 - (index % 5) * 2,
        sell: 10 + (index % 4),
        upside: Number((12 - index * 0.4).toFixed(1)),
      })),
      lastUpdated: "2026-06-26",
    });
  }
}
