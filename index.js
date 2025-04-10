const { addonBuilder } = require("stremio-addon-sdk");
const axios = require("axios");

const builder = new addonBuilder({
  id: "org.tmdb.catalog",
  version: "1.0.0",
  name: "TMDb Catálogo",
  description: "Catálogo de filmes e séries usando a API do TMDb",
  catalogs: [
    { type: "movie", id: "tmdb_populares" },
    { type: "series", id: "tmdb_series_atuais" }
  ],
  resources: ["catalog", "meta"],
  types: ["movie", "series"]
});

const TMDB_KEY = "SUA_CHAVE_TMDB_AQUI"; // Troque pela sua chave TMDb

builder.defineCatalogHandler(async ({ type, id }) => {
  let url;
  if (type === "movie" && id === "tmdb_populares") {
    url = `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}&language=pt-BR&page=1`;
  } else if (type === "series" && id === "tmdb_series_atuais") {
    url = `https://api.themoviedb.org/3/tv/on_the_air?api_key=${TMDB_KEY}&language=pt-BR&page=1`;
  }

  const { data } = await axios.get(url);
  const metas = data.results.map((item) => ({
    id: "tmdb" + item.id,
    type,
    name: item.title || item.name,
    poster: "https://image.tmdb.org/t/p/w500" + item.poster_path,
    description: item.overview
  }));

  return { metas };
});

builder.defineMetaHandler(async ({ id }) => {
  const tmdbId = id.replace("tmdb", "");
  const url = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_KEY}&language=pt-BR`;

  const { data } = await axios.get(url);
  return {
    meta: {
      id,
      type: "movie",
      name: data.title,
      poster: "https://image.tmdb.org/t/p/w500" + data.poster_path,
      background: "https://image.tmdb.org/t/p/original" + data.backdrop_path,
      description: data.overview,
      releaseInfo: data.release_date,
      runtime: data.runtime ? `${data.runtime} min` : null
    }
  };
});

const PORT = process.env.PORT || 7000;
builder.getInterface().then((addonInterface) => {
  require("http")
    .createServer((req, res) => {
      addonInterface(req, res);
    })
    .listen(PORT, () => {
      console.log("Addon rodando na porta " + PORT);
    });
});
