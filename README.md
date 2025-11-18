# risum

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.2. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

npx drizzle-kit generate
npx drizzle-kit push

exists (
select 1 from public.app_users u
where u.id = auth.uid() and u.role = 'admin'
)