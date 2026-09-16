import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111827",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 10, color: "#6b7280", marginTop: 2 },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  label: { fontSize: 9, color: "#6b7280", marginBottom: 2 },
  value: { fontSize: 11 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  table: { borderTopWidth: 1, borderTopColor: "#e5e7eb" },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 8,
    gap: 12,
  },
  itemName: { fontSize: 10.5 },
  itemDescription: { fontSize: 8.5, color: "#6b7280", marginTop: 2 },
  itemPrice: { fontSize: 10.5, fontFamily: "Helvetica-Bold", textAlign: "right" },
  itemPriceMuted: { fontSize: 10.5, color: "#6b7280", textAlign: "right" },
  itemCol: { flex: 3 },
  priceCol: { flex: 1.4 },
  totalsBox: {
    marginTop: 20,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#f8f7ff",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  totalLabel: { fontSize: 10, color: "#4b5563" },
  totalValue: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  grandTotalLabel: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  grandTotalValue: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#6d5ef8" },
  usdHint: { fontSize: 8.5, color: "#9ca3af", marginTop: 2 },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
  },
  validity: {
    marginTop: 24,
    fontSize: 8.5,
    color: "#9ca3af",
    textAlign: "center",
  },
});

export interface QuotePdfItem {
  name: string;
  description: string | null;
  quantity: number;
  unitPriceArs: number;
  unitPriceUsd: number;
  isRecurring: boolean;
  isClientCost: boolean;
}

export interface QuotePdfProps {
  quoteNumber: string;
  title: string;
  clientName: string;
  issueDate: string;
  validUntil: string | null;
  totalArs: number;
  totalUsd: number;
  depositPct: number;
  depositArs: number;
  balanceArs: number;
  monthlyArs: number;
  monthlyUsd: number;
  items: QuotePdfItem[];
}

const money = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`;

export function QuoteDocument({
  quoteNumber,
  title,
  clientName,
  issueDate,
  validUntil,
  totalArs,
  totalUsd,
  depositPct,
  depositArs,
  balanceArs,
  monthlyArs,
  monthlyUsd,
  items,
}: QuotePdfProps) {
  const oneOff = items.filter((i) => !i.isRecurring && !i.isClientCost);
  const recurring = items.filter((i) => i.isRecurring && !i.isClientCost);
  const clientCosts = items.filter((i) => i.isClientCost);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>
              Presupuesto {quoteNumber} · {issueDate}
            </Text>
          </View>
          <View>
            <Text style={styles.label}>Para</Text>
            <Text style={styles.value}>{clientName}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alcance</Text>
          <View style={styles.table}>
            {oneOff.map((item, i) => (
              <View style={styles.tableRow} key={i}>
                <View style={styles.itemCol}>
                  <Text style={styles.itemName}>
                    {item.name}
                    {item.quantity > 1 ? ` ×${item.quantity}` : ""}
                  </Text>
                  {item.description && (
                    <Text style={styles.itemDescription}>{item.description}</Text>
                  )}
                </View>
                <View style={styles.priceCol}>
                  <Text style={styles.itemPrice}>
                    {money(item.unitPriceArs * item.quantity)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {recurring.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Abono mensual</Text>
            <View style={styles.table}>
              {recurring.map((item, i) => (
                <View style={styles.tableRow} key={i}>
                  <View style={styles.itemCol}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.description && (
                      <Text style={styles.itemDescription}>{item.description}</Text>
                    )}
                  </View>
                  <View style={styles.priceCol}>
                    <Text style={styles.itemPrice}>
                      {money(item.unitPriceArs * item.quantity)}/mes
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {clientCosts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>No incluido — lo abonás vos directamente</Text>
            <View style={styles.table}>
              {clientCosts.map((item, i) => (
                <View style={styles.tableRow} key={i}>
                  <View style={styles.itemCol}>
                    <Text style={[styles.itemName, { color: "#6b7280" }]}>{item.name}</Text>
                    {item.description && (
                      <Text style={styles.itemDescription}>{item.description}</Text>
                    )}
                  </View>
                  <View style={styles.priceCol}>
                    <Text style={styles.itemPriceMuted}>
                      {money(item.unitPriceArs * item.quantity)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Seña ({depositPct}%)</Text>
            <Text style={styles.totalValue}>{money(depositArs)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Saldo restante</Text>
            <Text style={styles.totalValue}>{money(balanceArs)}</Text>
          </View>
          {monthlyArs > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Abono mensual</Text>
              <Text style={styles.totalValue}>
                {money(monthlyArs)}/mes (USD {Math.round(monthlyUsd)})
              </Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <View>
              <Text style={styles.grandTotalValue}>{money(totalArs)}</Text>
              <Text style={styles.usdHint}>USD {Math.round(totalUsd)}</Text>
            </View>
          </View>
        </View>

        {validUntil && (
          <Text style={styles.validity}>Precio válido hasta el {validUntil}.</Text>
        )}

        <Text style={styles.footer}>Presupuesto generado con Mission Control.</Text>
      </Page>
    </Document>
  );
}
