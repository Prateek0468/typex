'use client';

import React, { useState } from "react";
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

type FormDataType = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";


export default function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleLogin = async (data: FormDataType) => {
    const { email, password } = data;

    try {
      const response = await fetch(`${apiUrl}/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ email, password })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message);
      }

      console.log("login successful: ", result);
    } catch (err) {
      console.error(err);
    }

  }

  const handleSignup = async (data: FormDataType) => {
    // console.log(`${name} with ${email} is trying to signup using password ${password} confirm this with ${confirmPassword}`);

    try {
      const response = await fetch(`${apiUrl}/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(data)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message);
      }

      console.log("signup successful: ", result);
    } catch (err) {
      console.error(err);
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSignup) {
      handleSignup(formData);
    } else {
      handleLogin(formData);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // data will be saved as we type
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value,
    }))
  }

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
          <form onSubmit={handleSubmit}>
            <FieldGroup>

              {isSignup && (
                <Field>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
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
                  value={formData.email}
                  onChange={handleChange}
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
                  value={formData.password}
                  onChange={handleChange}
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
                    value={formData.confirmPassword}
                    onChange={handleChange}
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
