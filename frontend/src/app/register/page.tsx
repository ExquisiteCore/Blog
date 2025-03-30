"use client";

import { PATHS } from "@/lib/path";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { post } from "@/lib/http";
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
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  username: z.string().min(5, { message: "用户名至少需要5个字符" }),
  email: z.string().email({ message: "请输入有效的邮箱地址" }),
  password: z.string().min(6, { message: "密码至少需要6个字符" }),
  avatar_url: z.string().url({ message: "请输入有效的URL地址" }).optional()
});

export default function RegisterPage() {
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      avatar_url: ""
    }
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // 移除确认密码字段，后端API不需要
      const { ...registerData } = values;

      // 调用注册API
      await post("/users/register", registerData, { withToken: false });
      // 注册成功后跳转到登录页面
      router.push(PATHS.AUTH_SIGN_IN);
    } catch (error) {
      console.error('注册错误:', error);
      form.setError('root', {
        type: 'manual',
        message: error instanceof Error ? error.message : '注册失败'
      });
      // 清除密码字段
      form.setValue('password', '');
      form.setValue('avatar_url', '');
    }
  }

  return (
    <div className="grid h-screen w-screen place-content-center">
      <Card className="relative w-[320px] max-w-[95vw] animate-fade rounded-3xl py-4 sm:w-full sm:min-w-[360px] sm:max-w-[500px]">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>用户注册</span>
            <ModeToggle />
          </CardTitle>
          <CardDescription>欢迎注册EC的博客</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-6 w-full max-w-full">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="请输入用户名" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="请输入邮箱" {...field} />
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
                  <FormControl>
                    <Input type="password" placeholder="请输入密码" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="avatar_url"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="请输入头像URL（可选）" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.errors.root && (
              <div className="text-sm font-medium text-destructive">
                {form.formState.errors.root.message}
              </div>
            )}
            <Button type="submit" variant="default" className="w-full gap-4 flex justify-center">
              注册
            </Button>
          </form>
        </Form>
        <CardFooter className="px-6">
          <div className="w-full space-y-4">
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
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button
                variant="secondary"
                className="w-full"
                type="button"
                onClick={handleGoHome}
              >
                回首页
              </Button>
              <Button
                variant="outline"
                className="w-full"
                type="button"
                onClick={handleGoLogin}
              >
                去登录
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

  function handleGoLogin() {
    router.push(PATHS.AUTH_SIGN_IN);
  }
}