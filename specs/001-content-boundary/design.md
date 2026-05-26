# 001 Content Boundary - Design

## Content classes

```txt
embedded_srd
embedded_original
user_private_upload
licensed_partner_content
unknown
```

MVP should only use:

- `embedded_srd`
- `embedded_original`
- `user_private_upload`

## Metadata

Every content source should track:

```ts
type ContentSource = {
  id: string;
  title: string;
  contentClass: ContentClass;
  license?: string;
  attribution?: string;
  ownerUserId?: string;
  roomId?: string;
  visibility: "private" | "room" | "public";
};
```

## Rules

- `embedded_srd` may be used in compendium search and rules references.
- `embedded_original` may be used in demo and tests.
- `user_private_upload` may be used only within authorized rooms.
- `unknown` content must not be made public.
- Public sharing of uploaded content is disabled in MVP.

## Output behavior

AI responses should summarize/use content for gameplay, not recreate large copyrighted passages.

## Repository policy

Do not commit:

- official adventure text;
- official non-SRD rule text;
- commercial maps/artwork;
- copied stat blocks outside allowed SRD/open licenses.

Do commit:

- original demo text;
- tiny open/SRD fixtures with attribution metadata;
- schemas and tests.
