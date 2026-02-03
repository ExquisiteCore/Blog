import { Metadata } from "next";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "登录/注册",
  description: "登录或注册 ExquisiteCore 账户",
};

export default function AuthPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">欢迎回来</h1>
        <AuthForm />
      </div>
    </div>
  );
}
