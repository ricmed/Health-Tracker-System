interface BrazilState {
  type: string;
  id: string;
  properties: { name: string; sigla: string };
  geometry: { type: string; coordinates: number[] };
}

export const BRAZIL_GEOJSON: { type: string; features: BrazilState[] } = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", id: "AC", properties: { name: "Acre", sigla: "AC" }, geometry: { type: "Point", coordinates: [-70.55, -9.02] } },
    { type: "Feature", id: "AL", properties: { name: "Alagoas", sigla: "AL" }, geometry: { type: "Point", coordinates: [-36.62, -9.57] } },
    { type: "Feature", id: "AP", properties: { name: "Amapá", sigla: "AP" }, geometry: { type: "Point", coordinates: [-51.07, 1.41] } },
    { type: "Feature", id: "AM", properties: { name: "Amazonas", sigla: "AM" }, geometry: { type: "Point", coordinates: [-64.64, -4.07] } },
    { type: "Feature", id: "BA", properties: { name: "Bahia", sigla: "BA" }, geometry: { type: "Point", coordinates: [-41.71, -12.48] } },
    { type: "Feature", id: "CE", properties: { name: "Ceará", sigla: "CE" }, geometry: { type: "Point", coordinates: [-39.32, -5.20] } },
    { type: "Feature", id: "DF", properties: { name: "Distrito Federal", sigla: "DF" }, geometry: { type: "Point", coordinates: [-47.80, -15.83] } },
    { type: "Feature", id: "ES", properties: { name: "Espírito Santo", sigla: "ES" }, geometry: { type: "Point", coordinates: [-40.47, -19.57] } },
    { type: "Feature", id: "GO", properties: { name: "Goiás", sigla: "GO" }, geometry: { type: "Point", coordinates: [-49.64, -15.93] } },
    { type: "Feature", id: "MA", properties: { name: "Maranhão", sigla: "MA" }, geometry: { type: "Point", coordinates: [-45.27, -5.42] } },
    { type: "Feature", id: "MT", properties: { name: "Mato Grosso", sigla: "MT" }, geometry: { type: "Point", coordinates: [-55.92, -12.64] } },
    { type: "Feature", id: "MS", properties: { name: "Mato Grosso do Sul", sigla: "MS" }, geometry: { type: "Point", coordinates: [-54.79, -20.51] } },
    { type: "Feature", id: "MG", properties: { name: "Minas Gerais", sigla: "MG" }, geometry: { type: "Point", coordinates: [-44.39, -18.51] } },
    { type: "Feature", id: "PA", properties: { name: "Pará", sigla: "PA" }, geometry: { type: "Point", coordinates: [-52.97, -3.79] } },
    { type: "Feature", id: "PB", properties: { name: "Paraíba", sigla: "PB" }, geometry: { type: "Point", coordinates: [-36.62, -7.12] } },
    { type: "Feature", id: "PR", properties: { name: "Paraná", sigla: "PR" }, geometry: { type: "Point", coordinates: [-51.62, -24.89] } },
    { type: "Feature", id: "PE", properties: { name: "Pernambuco", sigla: "PE" }, geometry: { type: "Point", coordinates: [-37.27, -8.28] } },
    { type: "Feature", id: "PI", properties: { name: "Piauí", sigla: "PI" }, geometry: { type: "Point", coordinates: [-42.97, -7.72] } },
    { type: "Feature", id: "RJ", properties: { name: "Rio de Janeiro", sigla: "RJ" }, geometry: { type: "Point", coordinates: [-43.17, -22.91] } },
    { type: "Feature", id: "RN", properties: { name: "Rio Grande do Norte", sigla: "RN" }, geometry: { type: "Point", coordinates: [-36.72, -5.79] } },
    { type: "Feature", id: "RS", properties: { name: "Rio Grande do Sul", sigla: "RS" }, geometry: { type: "Point", coordinates: [-53.21, -30.03] } },
    { type: "Feature", id: "RO", properties: { name: "Rondônia", sigla: "RO" }, geometry: { type: "Point", coordinates: [-63.58, -10.83] } },
    { type: "Feature", id: "RR", properties: { name: "Roraima", sigla: "RR" }, geometry: { type: "Point", coordinates: [-61.13, 2.74] } },
    { type: "Feature", id: "SC", properties: { name: "Santa Catarina", sigla: "SC" }, geometry: { type: "Point", coordinates: [-49.38, -27.25] } },
    { type: "Feature", id: "SP", properties: { name: "São Paulo", sigla: "SP" }, geometry: { type: "Point", coordinates: [-48.06, -22.19] } },
    { type: "Feature", id: "SE", properties: { name: "Sergipe", sigla: "SE" }, geometry: { type: "Point", coordinates: [-37.45, -10.57] } },
    { type: "Feature", id: "TO", properties: { name: "Tocantins", sigla: "TO" }, geometry: { type: "Point", coordinates: [-48.33, -9.93] } },
  ],
};

export const STATE_COORDINATES: Record<string, [number, number]> = {
  'AC': [-70.55, -9.02],
  'AL': [-36.62, -9.57],
  'AP': [-51.07, 1.41],
  'AM': [-64.64, -4.07],
  'BA': [-41.71, -12.48],
  'CE': [-39.32, -5.20],
  'DF': [-47.80, -15.83],
  'ES': [-40.47, -19.57],
  'GO': [-49.64, -15.93],
  'MA': [-45.27, -5.42],
  'MT': [-55.92, -12.64],
  'MS': [-54.79, -20.51],
  'MG': [-44.39, -18.51],
  'PA': [-52.97, -3.79],
  'PB': [-36.62, -7.12],
  'PR': [-51.62, -24.89],
  'PE': [-37.27, -8.28],
  'PI': [-42.97, -7.72],
  'RJ': [-43.17, -22.91],
  'RN': [-36.72, -5.79],
  'RS': [-53.21, -30.03],
  'RO': [-63.58, -10.83],
  'RR': [-61.13, 2.74],
  'SC': [-49.38, -27.25],
  'SP': [-48.06, -22.19],
  'SE': [-37.45, -10.57],
  'TO': [-48.33, -9.93],
};
