# Nuxt Base App

This is a Nuxt layer which is still under development.  It is used as a reference on how to implement certain functionality and as a base for other projects.  

When used as a layer, initialize the db with: `npx nuxt db generate`

Disclosure:  AI was used on a function by function basis, and never a "go architect and build out a subsystem" basis.  If you like it or hate it, the architecture is mine.  Feel free to point out inconsistencies or inefficiencies.  After implementing many internal websites, my goal was to create a boilerplate for reuse and maintenance purposes.

Most notably the admin ui and roles is still missing as of 09.06.26.  Until I implement TanStack, there is also no caching.

On the server side, db wrappers work but are inefficient.

default admin user: admin@admin.com / !1adminadmin

## Features
- Table / Form components, schemas, validation
- Fetch method wrappers with notifications / i18n
- frontend / backend metadata json files for app config
- Integrated server cron
- basic login/out persisted with nuxt hub => drizzle => sqlite

## Backend

### Routes
- [o] verify routes are using app_conf.ts // subset moved to zod
- [x] verify routes are using persist/mem_*
- [x] verify routes use services, services use rules
- [x] verify routes sending i18n errs
- [x] add api version in routes
- [x] all routes return i18n, data, and message
- [x] all routes use zod for schemas
- [ ] RBAC
- [ ] verify routes use roles
- [ ] send validation email on signup
- [ ] allow sso/oauth

### Collections
- [x] crud accounts
- [x] crud app_data  
- [x] crud roles

## Frontend

### Components
- [x] header
- [x] footer
- [x] notify
- [ ] table filtering / sorting / pagination
- [ ] make NPM: table/form

### Pages
- [x] landing
- [x] login
- [x] index
- [x] signup
- [ ] admin crud acct, set ident, roles

### UI General
- [x] mitt pubsub
- [x] i18n
- [x] i18n xlate error messages
- [x] middleware: auth
- [x] fetch wrapper
- [ ] tooltips: all icons and buttons

### FINAL
- [ ] tighten password zod rules
- [ ] make vitest tests for each route.
- [ ] refactor dbFindOneAndDelete, dbFindOneAndUpdate - make difference between del and del with searchspec
- [ ] use abortsignal on socket listeners  -make sure cleaned up

### Other
- [ ] forms: multiple getRules - refactor
- [ ] test on mobile
- [ ] RBAC/Admin/tanstack pages (see above)
- [ ] verify notify et. al. is i18ned