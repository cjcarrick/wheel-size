# brz-wheel-size

To keep things lightweight and functional, this does not have any dependencies.
CSS is also kept to a minimum.

All files are static--there is no real backend server or database that stores the
data. All data on example setups comes from `src/examples/*`. Update those
examples, then run `npm run generate` to parse it into the files in
`dist/examples/`. The files here are broken up by wheel size and offset, which
is easier for the web interface to query (eg: it can just `GET
/examples/<car>/<width>/<offset>.json`).

This might not scale well, but GitHub pages is free :D
