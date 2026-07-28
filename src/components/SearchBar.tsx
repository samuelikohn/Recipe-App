import { Pressable, StyleSheet, Text, TextInput, View } from "react-native"

type Props = {
	value: string
	onChangeText: (text: string) => void
	placeholder?: string
	autoFocus?: boolean
}

export function SearchBar({
	value,
	onChangeText,
	placeholder = "Search recipes",
	autoFocus
}: Props) {
	return (
		<View style={styles.container}>
			<TextInput
				style={styles.input}
				value={value}
				onChangeText={onChangeText}
				placeholder={placeholder}
				placeholderTextColor="#999"
				autoFocus={autoFocus}
				autoCorrect={false}
				returnKeyType="search"
			/>
			{value.length > 0 ? (
				<Pressable
					onPress={() => onChangeText("")}
					hitSlop={8}
					style={styles.clear}
				>
					<Text style={styles.clearText}>✕</Text>
				</Pressable>
			) : null}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#f2f2f2",
		borderRadius: 10,
		paddingHorizontal: 12,
		paddingVertical: 8,
		margin: 12
	},
	input: {
		flex: 1,
		fontSize: 16,
		color: "#222",
		padding: 0
	},
	clear: {
		marginLeft: 8,
		width: 20,
		height: 20,
		alignItems: "center",
		justifyContent: "center"
	},
	clearText: {
		color: "#666",
		fontSize: 14
	}
})
