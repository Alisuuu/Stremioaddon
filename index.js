const { addonBuilder } = require("stremio-addon-sdk");
const axios = require("axios");

const TMDB_KEY = "5e5da432e96174227b25086fe8637985";

const builder = new addonBuilder({
  id: "org.tmdb.catalog",
  version: "1.0.0",
  name: "TMDb Catálogo",
  description: "Catálogo de filmes e séries usando a API do TMDb",
  catalogs: [
    { type: "movie", id: "tmdb_populares", name: "Filmes Populares" },
    { type: "series", id: "tmdb_series_atuais", name: "Séries Atuais" }
  ],
  resources: ["catalog", "meta"],
  types: ["movie", "series"]
});

// Catálogo de filmes/séries
builder.defineCatalogHandler(async ({ type, id }) => {
  let url;
  if (type === "movie" && id === "tmdb_populares") {
    url = `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}&language=pt-BR&page=1`;
  } else if (type === "series" && id === "tmdb_series_atuais") {
    url = `https://api.themoviedb.org/3/tv/on_the_air?api_key=${TMDB_KEY}&language=pt-BR&page=1`;
  } else {
    return { metas: [] };
  }

  const { data } = await axios.get(url);
  const metas = data.results.map((item) => ({
    id: "tmdb" + item.id,
    type,
    name: item.title || item.name,
    poster: item.poster_path ? "https://image.tmdb.org/t/p/w500" + item.poster_path : null,
    description: item.overview
  }));

  return { metas };
});

// Detalhes do item
builder.defineMetaHandler(async ({ id }) => {
  const tmdbId = id.replace("tmdb", "");
  const urlMovie = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_KEY}&language=pt-BR`;
  const urlSerie = `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${TMDB_KEY}&language=pt-BR`;

  try {
    const { data } = await axios.get(urlMovie);
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
  } catch (e) {
    const { data } = await axios.get(urlSerie);
    return {
      meta: {
        id,
        type: "series",
        name: data.name,
        poster: "https://image.tmdb.org/t/p/w500" + data.poster_path,
        background: "https://image.tmdb.org/t/p/original" + data.backdrop_path,
        description: data.overview,
        releaseInfo: data.first_air_date,
        runtime: data.episode_run_time?.length ? `${data.episode_run_time[0]} min` : null
      }
    };
  }
});

module.exports = builder.getInterface(); // ESSENCIAL para Vercel
