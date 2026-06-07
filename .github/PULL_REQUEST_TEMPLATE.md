## Summary

-

## Related Issue

-

## Confirmed API IF

- Method / Path:
- Params / Query / Body:
- Response DTO:
- Error responses:
- Swagger tag / summary / description:

## Scope

- [ ] Controller mock
- [ ] DTO
- [ ] Swagger docs decorator
- [ ] Controller test
- [ ] OpenAPI e2e test

## Out of Scope

- Service changes
- External API connection
- Resource implementation
- Provider-specific error mapping

## Verification

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test --runInBand`
- [ ] `pnpm build`
- [ ] `pnpm test:e2e --runInBand` if OpenAPI endpoint behavior changed

## Swagger / OpenAPI Checklist

- [ ] Endpoint exists in `paths`
- [ ] Response schema references DTO
- [ ] Error responses are defined
- [ ] Tag / summary / description are defined
- [ ] Entity schemas are not exposed
