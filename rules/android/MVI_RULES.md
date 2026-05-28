# MVI Rules

- Do not place classes or constants inside MVI classes; declare them at file level or in dedicated files/packages.
- For screen models backed by local collections, avoid storing or updating `isLoading` when loading can be derived from the collection state; treat the screen as loading when the backing collection is empty.
- For screen data backed by Room and refreshed from network, use separate `Collect...` and `Load...` intents: `Collect...` reads Room data, `Load...` performs the network request and saves the result to Room.
