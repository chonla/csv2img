# CSV2IMG

Create an image of CSV in table representation.

## Start a server

```sh
deno run --allow-net --allow-write --allow-read --allow-env --allow-ffi --unstable-ffi index.ts
```

## Generating an image

```sh
curl -v http://localhost/ -H "content-type:application/json" --data @csv_request.json
```

## Request Schema

See [schema](./schema/create_request.json).