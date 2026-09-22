/**
 * Marca de Dashboard TARC Tech: una "T" facetada en azul, hermana del
 * isotipo naranja de tarc-tech (la "forja facetada") pero en la paleta fría
 * de este panel interno. Usa solo flexbox + estilos inline a propósito:
 * es exactamente el mismo árbol que `app/icon.tsx` y `app/apple-icon.tsx`
 * (que corren dentro de Satori, sin Tailwind) — así el ícono del navegador
 * y la marca dentro de la app son visualmente idénticos a cualquier escala.
 */
export function BrandMark({ size = 32 }: { size?: number }) {
  const s = size;

  return (
    <div
      style={{
        width: s,
        height: s,
        borderRadius: s * 0.24,
        background: "linear-gradient(135deg, #60a5fa 0%, #1d4ed8 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", width: s * 0.6, height: s * 0.16 }}>
          <div style={{ flex: 1, background: "#ffffff" }} />
          <div style={{ flex: 1, background: "rgba(255,255,255,0.72)" }} />
        </div>
        <div
          style={{
            width: s * 0.17,
            height: s * 0.4,
            marginTop: s * 0.045,
            background: "#ffffff",
          }}
        />
      </div>
    </div>
  );
}
