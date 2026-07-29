import { StyleSheet, Text, View } from "react-native"
import { colors } from "../theme/colors"
import { fontSize, fontWeight } from "../theme/typography"

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
		fontSize: fontSize.componentTitle,
		fontWeight: fontWeight.semibold,
		color: colors.textDefault,
		textAlign: "center"
	},
	subtitle: {
		marginTop: 8,
		fontSize: fontSize.body,
		color: colors.textFaint,
		textAlign: "center"
	}
})
