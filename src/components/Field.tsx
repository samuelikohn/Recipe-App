import { StyleSheet, Text, View } from "react-native"
import { colors } from "../theme/colors"
import { typography } from "../theme/typography"

export default function Field({
	label,
	children,
	style
}: {
	label: string
	children: React.ReactNode
	style?: object
}) {
	return (
		<View style={[styles.field, style]}>
			<Text style={styles.fieldLabel}>{label}</Text>
			{children}
		</View>
	)
}

const styles = StyleSheet.create({
	field: {
		marginBottom: 20
	},
	fieldLabel: {
		...typography.sectionHeader,
		color: colors.textMuted,
		marginBottom: 6
	}
})
