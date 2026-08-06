# Nuxt Base App

This is a Nuxt layer which is still under development.  It is used as a reference on how to implement certain functionality and as a base for other projects.  

Disclosure:  AI was used on a function by function basis, and never a "go architect and build out a subsystem" basis.  If you like it or hate it, the architecture is mine.  Feel free to point out inconsistencies or inefficiencies.  After implementing many internal websites, my goal was to create a boilerplate for reuse and maintenance purposes.


Until I implement TanStack, there is no API result caching.
On the server side, db wrappers work but are inefficient.

default admin user: admin@admin.com / !1adminadmin

## Features
- Table / Form components, schemas, validation
- Fetch method wrappers with notifications / i18n
- frontend / backend metadata json files for app config
- Integrated server cron
- basic login/out persisted with nuxt hub => drizzle => sqlite
- 150+ notification services via Apprise

# TODO

## Backend

### Notifications
- [ ] Apprise add icon and overflow params to url in service call
- [ ] Apprise add click => url to email
- [ ] Apprise: If text too long, send as attachment

### Routes
- [ ] Table routes: add filtering, sorting, pagination
- [ ] send validation email on signup
- [ ] allow sso/oauth
- [ ] verify format of all thrown errors, make xlations for them.
- [ ] If perms change, push immediately. no logout/login


### DB
- [ ] Default limits to notification config json value.
- [ ] create custom triggers for atomic ops.  Eg: on delete account, delete all related records
    when deleting key, delete key in foreign rows.
        roles, notification_channels
- [ ] if user changes email, validated = false, resend email

## Frontend

### Components
- [ ] table support client side filtering / sorting / pagination
- [ ] table: id get component w id tooltip.  search on both.
- [ ] forms: add default to schema and then remove seeddata hardcoding in form.vue
- [ ] make NPM: table/form/notificatoins
- [ ] update documentation
- [ ] make event bell icon in header for logs.
- [ ] when deleting account, have custom UI and log out.
- [ ] for all keys that are unique to a form setter, put in {options:{}}
- [ ] Table: make schema prep util., derive onACTION from action: 
        MAYBE: don't make create, update, del automatic but give default fcns that can be added to schema.

### UI General
- [ ] tooltips: all icons and buttons
- [ ] when admin and setting identity. if reloading page, the name in the header returns to the default.

### FINAL
- [ ] from shared schema, default to configured account "limits" and use enum for form
    also in shared zod rules
- [ ] shared auto imported ts types
- [ ] tighten password zod rules
- [ ] make vitest tests for each route.
- [ ] refactor dbFindOneAndDelete, dbFindOneAndUpdate - make difference between del and del with searchspec
- [ ] use abortsignal on socket listeners  -make sure cleaned up
- [ ] forms: multiple getRules - refactor
- [ ] test on mobile

