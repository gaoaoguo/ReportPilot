import { z } from "zod";
import { normalizeEmail } from "@/lib/auth-utils";

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .email("请输入有效邮箱")
    .transform((value) => normalizeEmail(value)),
  password: z.string().min(8, "密码至少需要 8 位").max(128, "密码不能超过 128 位"),
  name: z.string().trim().min(1, "请输入姓名").max(50, "姓名不能超过 50 个字符")
});

export type RegisterInput = z.infer<typeof registerSchema>;
