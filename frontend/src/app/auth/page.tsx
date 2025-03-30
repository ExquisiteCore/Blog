"use client";

import { PATHS } from "@/lib/path";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { post } from "@/lib/http";
import { LoginResponse, AuthState } from "@/lib/types";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  username_or_email: z.string().min(5, { message: "用户名或邮箱至少需要5个字符" }),
  password: z.string().min(6, { message: "密码至少需要6个字符" })
});

export default function SignInPage() {
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username_or_email: "",
      password: ""
    }
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // 使用封装的axios post方法替代fetch，指定返回类型为LoginResponse
      const data = await post<LoginResponse>("/users/login", values, { withToken: false });
      // 处理返回的token和用户数据
      console.log('登录成功:', data);

      // 将token和用户信息存储到localStorage
      if (data && data.token && data.user) {
        const { token, user } = data;

        // 存储用户信息，使用AuthState类型
        const authState: AuthState = {
          token,
          user
        };
        localStorage.setItem('auth', JSON.stringify(authState));
      }

      router.push(PATHS.SITE_HOME);
    } catch (error) {
      console.error('登录错误:', error);
      form.setError('root', {
        type: 'manual',
        message: error instanceof Error ? error.message : '登录失败'
      });
      // 清除密码字段
      form.setValue('password', '');
    }
  }

  return (
    <div className="grid h-screen w-screen place-content-center">
      <Card className="relative w-[320px] animate-fade rounded-3xl py-4 sm:w-full sm:min-w-[360px] sm:max-w-none">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>用户登录</span>
            <ModeToggle />
          </CardTitle>
          <CardDescription>欢迎来到EC的博客</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="username_or_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>用户名或邮箱</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入用户名或邮箱" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>密码</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="请输入密码" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" variant="default" className="w-full gap-4 flex justify-center">
              登录
            </Button>
          </form>
        </Form>
        <CardFooter>
          <div className="grid w-full gap-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  或者
                </span>
              </div>
            </div>
            <div className="flex justify-center">
              <Button
                variant="default"
                className="w-full"
                type="button"
                onClick={handleGoHome}
              >
                回首页
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );

  function handleGoHome() {
    router.push(PATHS.SITE_HOME);
  }
}
