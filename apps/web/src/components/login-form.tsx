'use client';

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isSignup, setIsSignup] = useState(false);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>
            {isSignup ? "Create an account" : "Login to your account"}
          </CardTitle>

          <CardDescription>
            {isSignup
              ? "Enter your details below to create an account"
              : "Enter your email below to login to your account"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form>
            <FieldGroup>

              {isSignup && (
                <Field>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    required
                  />
                </Field>
              )}

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </Field>

              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>

                  {!isSignup && (
                    <a
                      href="#"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  )}
                </div>

                <Input
                  id="password"
                  type="password"
                  required
                />
              </Field>

              {isSignup && (
                <Field>
                  <FieldLabel htmlFor="confirmPassword">
                    Confirm Password
                  </FieldLabel>

                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                  />
                </Field>
              )}

              <Field>
                <Button type="submit" className="w-full">
                  {isSignup ? "Create Account" : "Login"}
                </Button>

                <Button
                  variant="outline"
                  type="button"
                  className="w-full mt-2"
                >
                  Continue with Google
                </Button>

                <FieldDescription className="text-center mt-4">
                  {isSignup ? (
                    <>
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setIsSignup(false)}
                        className="underline hover:text-primary cursor-pointer"
                      >
                        Login
                      </button>
                    </>
                  ) : (
                    <>
                      Don&apos;t have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setIsSignup(true)}
                        className="underline hover:text-primary cursor-pointer"
                      >
                        Sign up
                      </button>
                    </>
                  )}
                </FieldDescription>
              </Field>

            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}