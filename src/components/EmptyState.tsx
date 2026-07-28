import { StyleSheet, Text, View } from "react-native"

type Props = {
	title: string
	subtitle?: string
}

export function EmptyState({ title, subtitle }: Props) {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>{title}</Text>
			{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 32
	},
	title: {
		fontSize: 18,
		fontWeight: "600",
		color: "#333",
		textAlign: "center"
	},
	subtitle: {
		marginTop: 8,
		fontSize: 14,
		color: "#777",
		textAlign: "center"
	}
})
