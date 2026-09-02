import { StyleSheet, Text, View } from "react-native"
import { useThemedStyles } from "../theme/ThemeProvider"
import { ThemeColors } from "../theme/colors"
import { fontSize, fontWeight } from "../theme/typography"

type Props = {
	title: string
	subtitle?: string
}

export function EmptyState({ title, subtitle }: Props) {
	const styles = useThemedStyles(makeStyles)

	return (
		<View style={styles.container}>
			<Text style={styles.title}>{title}</Text>
			{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
		</View>
	)
}

const makeStyles = (colors: ThemeColors) =>
	StyleSheet.create({
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
