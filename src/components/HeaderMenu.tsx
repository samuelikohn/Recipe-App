import { Fragment, useState } from "react"
import { Modal, Pressable, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useThemedStyles } from "../theme/ThemeProvider"
import { ThemeColors } from "../theme/colors"

export type HeaderMenuItem = {
	label: string
	onPress: () => void
}

type Props = {
	items: HeaderMenuItem[]
}

/**
 * `⋮` kebab button for a navigation header's `headerRight`, plus the dropdown
 * it opens. The dropdown is a transparent Modal so it floats above the
 * screen and a tap anywhere outside it dismisses. Picking an item closes the
 * menu before running the item's action, so actions that navigate don't
 * leave the menu open behind them.
 */
export function HeaderMenu({ items }: Props) {
	const [visible, setVisible] = useState(false)
	const insets = useSafeAreaInsets()
	const styles = useThemedStyles(makeStyles)

	return (
		<Fragment>
			<Pressable
				onPress={() => setVisible(true)}
				hitSlop={8}
				accessibilityLabel="More options"
				style={styles.button}
			>
				<Text style={styles.buttonText}>⋮</Text>
			</Pressable>

			<Modal
				visible={visible}
				transparent
				animationType="fade"
				onRequestClose={() => setVisible(false)}
			>
				<Pressable
					style={styles.overlay}
					onPress={() => setVisible(false)}
				>
					<View style={[styles.menu, { top: insets.top + 48 }]}>
						{items.map((item) => (
							<Pressable
								key={item.label}
								style={styles.item}
								onPress={() => {
									setVisible(false)
									item.onPress()
								}}
							>
								<Text style={styles.itemText}>
									{item.label}
								</Text>
							</Pressable>
						))}
					</View>
				</Pressable>
			</Modal>
		</Fragment>
	)
}

const makeStyles = (colors: ThemeColors) =>
	StyleSheet.create({
		button: {
			paddingHorizontal: 8
		},
		buttonText: {
			fontSize: 24,
			color: colors.primary
		},
		overlay: {
			flex: 1
		},
		menu: {
			position: "absolute",
			right: 12,
			backgroundColor: colors.background,
			borderRadius: 8,
			paddingVertical: 4,
			minWidth: 140,
			shadowColor: "#000",
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.15,
			shadowRadius: 6,
			elevation: 4
		},
		item: {
			paddingVertical: 10,
			paddingHorizontal: 16
		},
		itemText: {
			fontSize: 16,
			color: colors.primary
		}
	})
