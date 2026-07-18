import { describe, it, expect } from "vitest";
import { registrationSchema, loginSchema } from "./auth";

const validRegistration = {
  full_name: "John Doe",
  email: "john@example.com",
  phone: "+12125551234",
  gender: "male" as const,
  age: 25,
  church_branch_id: "550e8400-e29b-41d4-a716-446655440000",
};

describe("registrationSchema", () => {
  it("passes with valid data", () => {
    const result = registrationSchema.safeParse(validRegistration);
    expect(result.success).toBe(true);
  });

  it("fails when full_name is missing", () => {
    const result = registrationSchema.safeParse({
      ...validRegistration,
      full_name: "",
    });
    expect(result.success).toBe(false);
  });

  it("fails with invalid email", () => {
    const result = registrationSchema.safeParse({
      ...validRegistration,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("fails with invalid phone format", () => {
    const result = registrationSchema.safeParse({
      ...validRegistration,
      phone: "123",
    });
    expect(result.success).toBe(false);
  });

  it("accepts phone format +1 XXX-XXX-XXXX", () => {
    const result = registrationSchema.safeParse({
      ...validRegistration,
      phone: "+1 212-555-1234",
    });
    expect(result.success).toBe(true);
  });

  it("accepts phone in E.164 format", () => {
    const result = registrationSchema.safeParse({
      ...validRegistration,
      phone: "+233241234567",
    });
    expect(result.success).toBe(true);
  });

  it("accepts international phone format", () => {
    const result = registrationSchema.safeParse({
      ...validRegistration,
      phone: "+44 7911 123456",
    });
    expect(result.success).toBe(true);
  });

  it("fails when age <= 0", () => {
    const result = registrationSchema.safeParse({
      ...validRegistration,
      age: 0,
    });
    expect(result.success).toBe(false);
  });

  it("fails when gender is not male/female", () => {
    const result = registrationSchema.safeParse({
      ...validRegistration,
      gender: "other",
    });
    expect(result.success).toBe(false);
  });

  it("fails when church_branch_id is missing", () => {
    const result = registrationSchema.safeParse({
      ...validRegistration,
      church_branch_id: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("passes with valid email", () => {
    const result = loginSchema.safeParse({ email: "test@example.com" });
    expect(result.success).toBe(true);
  });

  it("fails with invalid email", () => {
    const result = loginSchema.safeParse({ email: "bad" });
    expect(result.success).toBe(false);
  });
});
