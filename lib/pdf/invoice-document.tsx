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
    marginBottom: 32,
  },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 10, color: "#6b7280", marginTop: 2 },
  badge: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  section: { marginBottom: 20 },
  label: { fontSize: 9, color: "#6b7280", marginBottom: 2 },
  value: { fontSize: 11, marginBottom: 10 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  table: { marginTop: 10, borderTopWidth: 1, borderTopColor: "#e5e7eb" },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 8,
  },
  colDescription: { flex: 4 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1.5, textAlign: "right" },
  colSubtotal: { flex: 1.5, textAlign: "right" },
  tableHeaderText: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#6b7280" },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
    gap: 24,
  },
  totalLabel: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  totalValue: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
  },
});

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviada",
  paid: "Pagada",
  overdue: "Vencida",
  cancelled: "Cancelada",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "#6b7280",
  sent: "#2563eb",
  paid: "#16a34a",
  overdue: "#dc2626",
  cancelled: "#6b7280",
};

export interface InvoicePdfProps {
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string | null;
  currency: string;
  totalAmount: number;
  clientName: string;
  clientEmail: string | null;
  items: { description: string; quantity: number; unitPrice: number; subtotal: number }[];
}

export function InvoiceDocument({
  invoiceNumber,
  status,
  issueDate,
  dueDate,
  currency,
  totalAmount,
  clientName,
  clientEmail,
  items,
}: InvoicePdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Factura {invoiceNumber}</Text>
            <Text style={styles.subtitle}>Emitida el {issueDate}</Text>
          </View>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: `${STATUS_COLORS[status] ?? "#6b7280"}1a`,
                color: STATUS_COLORS[status] ?? "#6b7280",
              },
            ]}
          >
            <Text>{STATUS_LABELS[status] ?? status}</Text>
          </View>
        </View>

        <View style={[styles.section, styles.row]}>
          <View>
            <Text style={styles.label}>Cliente</Text>
            <Text style={styles.value}>{clientName}</Text>
            {clientEmail && <Text style={styles.subtitle}>{clientEmail}</Text>}
          </View>
          {dueDate && (
            <View>
              <Text style={styles.label}>Vencimiento</Text>
              <Text style={styles.value}>{dueDate}</Text>
            </View>
          )}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colDescription, styles.tableHeaderText]}>Descripción</Text>
            <Text style={[styles.colQty, styles.tableHeaderText]}>Cant.</Text>
            <Text style={[styles.colPrice, styles.tableHeaderText]}>Precio</Text>
            <Text style={[styles.colSubtotal, styles.tableHeaderText]}>Subtotal</Text>
          </View>
          {items.map((item, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>
                {currency} {item.unitPrice.toLocaleString("es-AR")}
              </Text>
              <Text style={styles.colSubtotal}>
                {currency} {item.subtotal.toLocaleString("es-AR")}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            {currency} {totalAmount.toLocaleString("es-AR")}
          </Text>
        </View>

        <Text style={styles.footer}>Generado con Mission Control — panel personal de gestión freelance.</Text>
      </Page>
    </Document>
  );
}
