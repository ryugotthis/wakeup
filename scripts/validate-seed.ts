/**
 * 역할: seed.products.json이 정의된 JSON Schema(seed.products.schema.json)를
 * 충족하는지 검증하는 **Seed 데이터 유효성 검사 스크립트**.
 *
 * - Ajv(JSON Schema validator)로 스키마 컴파일
 * - seed.products.json을 스키마와 대조
 * - 오류가 있으면 에러 출력 후 프로세스 종료(배포/시딩 차단)
 * - 통과하면 "Seed validation passed" 출력
 */

import fs from "node:fs";
import Ajv from "ajv";

const ajv = new Ajv({
  allErrors: true,
});

const schema = JSON.parse(
  fs.readFileSync("./seed/seed.products.schema.json", "utf-8"),
);

const data = JSON.parse(fs.readFileSync("./seed/seed.products.json", "utf-8"));

const validate = ajv.compile(schema);
const valid = validate(data);

if (!valid) {
  console.error("❌ Seed validation failed");
  console.error(validate.errors);
  process.exit(1);
}

console.log("✅ Seed validation passed");
