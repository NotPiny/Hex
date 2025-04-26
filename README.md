# Hex
Hex is a collection of discord tools such as a components v2 builders. Hex is a work in progress and is not yet complete and may include bugs. If you find any bugs please report them in the issues section of the repository.

## Tools
### Components V2 Builder
A GUI to build [components v2](https://discord.com/developers/docs/components/reference) and export to json through either the clipboard or automatically sent to another page.

#### Query
The builder supports the following query parameters:
* `min`: If present, the output will be minified.
* `redir`: If present, the output will be redirected to the specified URL with a `json` query parameter added on.
* `json`: If present, the builder will automatically start with the specified json. This is useful for if you want to integrate it with another page. The JSON will be encoded with base64 you can decode it with `decodeURIComponent(atob(json))`. The JSON will be parsed and the builder will be populated with the values. The JSON must be a valid components v2 JSON. If the JSON is invalid, the builder will not load and an error message will be displayed.