# Authentication Screens

> **Login, Forgot Password, Reset Password Screen Specifications**

---

## 🔐 Login Screen

### Visual Design

```
┌─────────────────────────────────────┐
│                                     │
│           [Company Logo]            │
│                                     │
│        ISP Management System        │
│      Enterprise Mobile Portal       │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 👤  Username                 │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🔒  Password            👁️  │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │         Sign In              │   │
│  └─────────────────────────────┘   │
│                                     │
│         Forgot Password?            │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│     [Customer Self-Service Login]   │
│                                     │
└─────────────────────────────────────┘
```

### Screen Specifications

| Property | Value |
|----------|-------|
| Route | `/login` |
| Auth Required | No |
| Background | Gradient: `primary.600` → `primary.800` |

### Components

| Element | Component | Props |
|---------|-----------|-------|
| Logo | `Image` | Company logo, height: 80 |
| Title | `Text.h2` | "ISP Management System" |
| Subtitle | `Text.caption` | "Enterprise Mobile Portal" |
| Username | `TextInput` | leftIcon: 'user', required |
| Password | `TextInput` | leftIcon: 'lock', secureEntry |
| Sign In | `Button.primary` | fullWidth, size: 'lg' |
| Forgot Link | `Button.ghost` | "Forgot Password?" |
| Customer Login | `Button.outline` | "Customer Self-Service" |

### Form Schema

```typescript
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
```

### Actions

| Action | Handler |
|--------|---------|
| Submit | Call `authService.login()`, store token, redirect |
| Forgot Password | Navigate to `/forgot-password` |
| Customer Login | Navigate to `/(customer)/login` |

---

## 📧 Forgot Password Screen

### Visual Design

```
┌─────────────────────────────────────┐
│  ←                                  │
│                                     │
│           🔐                        │
│                                     │
│       Forgot Password               │
│                                     │
│  Enter your email address and       │
│  we'll send you a password reset    │
│  link.                              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ✉️  Email Address            │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │      Send Reset Link         │   │
│  └─────────────────────────────┘   │
│                                     │
│         ← Back to Login             │
│                                     │
└─────────────────────────────────────┘
```

### Screen Specifications

| Property | Value |
|----------|-------|
| Route | `/forgot-password` |
| Auth Required | No |
| Layout | Centered, max-width 400 |

### Form Schema

```typescript
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});
```

---

## 🔄 Reset Password Screen

### Visual Design

```
┌─────────────────────────────────────┐
│  ←                                  │
│                                     │
│           🔒                        │
│                                     │
│       Create New Password           │
│                                     │
│  Your new password must be          │
│  different from previously used.    │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🔒  New Password         👁️  │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🔒  Confirm Password     👁️  │   │
│  └─────────────────────────────┘   │
│                                     │
│  Password Requirements:             │
│  ✓ At least 8 characters           │
│  ✓ Contains a number               │
│                                     │
│  ┌─────────────────────────────┐   │
│  │      Reset Password          │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### Form Schema

```typescript
const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/\d/, 'Password must contain a number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
```

---

## 🪪 Customer Portal Login

### Visual Design

```
┌─────────────────────────────────────┐
│                                     │
│           [Company Logo]            │
│                                     │
│        Customer Portal              │
│    View Invoices & Payments         │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🪪  CNIC Number              │   │
│  │    _____-_______-_          │   │
│  └─────────────────────────────┘   │
│                                     │
│  Enter your 13-digit CNIC number    │
│  to access your account.            │
│                                     │
│  ┌─────────────────────────────┐   │
│  │       Access My Account      │   │
│  └─────────────────────────────┘   │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│       [Staff Login →]               │
│                                     │
└─────────────────────────────────────┘
```

### Form Schema

```typescript
const customerLoginSchema = z.object({
  cnic: z
    .string()
    .regex(/^\d{5}-\d{7}-\d{1}$/, 'Please enter valid CNIC format'),
});
```

### CNIC Input Masking

```typescript
const formatCnic = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
};
```
