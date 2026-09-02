import { StyleSheet, Text, View } from "react-native"
import { useThemedStyles } from "../theme/ThemeProvider"
import { ThemeColors } from "../theme/colors"
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
	const styles = useThemedStyles(makeStyles)

	return (
		<View style={[styles.field, style]}>
			<Text style={styles.fieldLabel}>{label}</Text>
			{children}
		</View>
	)
}

const makeStyles = (colors: ThemeColors) =>
	StyleSheet.create({
		field: {
			marginBottom: 20
		},
		fieldLabel: {
			...typography.sectionHeader,
			color: colors.textMuted,
			marginBottom: 6
		}
	})
