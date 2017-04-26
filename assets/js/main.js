var width = 700,
    height = 350;



// DATA PREPARATION
var dsv = d3.dsv(";", "text/plain");

d3.queue()
    .defer(d3.json, "assets/data/world.geojson")
    .defer(dsv, "assets/data/opere_colori_geo.csv", function(d) {
        // filter only useful attributes:
        // ANNO_ARTWORK, ARTWORK_PLACE, ARTWORK_PLACE_LAT, ARTWORK_PLACE_LON, MUSEUM
        // TECHNIQUE, TYPE, SCHOOL

        var m = {
            // convert strings to numbers
            ANNO_ARTWORK: +d.ANNO_ARTWORK,
            ARTWORK_PLACE_LAT: +d.ARTWORK_PLACE_LAT,
            ARTWORK_PLACE_LON: +d.ARTWORK_PLACE_LON,
            BIRTH_PLACE: d.BIRTH_PLACE,
            BIRTH_LAT: +d.BIRTH_LAT,
            BIRTH_LON: +d.BIRTH_LON,
            BIRTH_PLACE_ISO2: d.BIRTH_PLACE_ISO2,
            BIRTH_PLACE_CNT: d.BIRTH_PLACE_CNT,
            ARTWORK_PLACE_ISO2: d.ARTWORK_PLACE_ISO2,
            ARTWORK_PLACE_CNT: d.ARTWORK_PLACE_CNT,

            // select only a few attributes
            ARTWORK_PLACE: d.ARTWORK_PLACE,
            MUSEUM: d.MUSEUM,
            TECHNIQUE: d.TECHNIQUE,
            TYPE: d.TYPE,
            SCHOOL: d.SCHOOL,

            // discard all the others
        }

        // return the modified row
        return m;
    })
    .await(callback);

function callback(error, mondo, opere) {
    if (error) console.log("error", error);
    json = mondo.features;


    // GROUP opere by ARTIST BIRTH PLACE
    birth_place_count = d3.nest()
        .key(function(d) {
            return d.BIRTH_PLACE_ISO2
        })
        .rollup(function(leaves) {
            return leaves.length
        })
        .map(opere);
    console.log("birth_place_count", birth_place_count);

    // GROUP artwork by ARTWORK MUSEUM PLACE
    artwork_place_count = d3.nest()
        .key(function(d) {
            return d.ARTWORK_PLACE_ISO2
        })
        .rollup(function(leaves) {
            return leaves.length
        })
        .map(opere);
    console.log("artwork_place_count", artwork_place_count);



}