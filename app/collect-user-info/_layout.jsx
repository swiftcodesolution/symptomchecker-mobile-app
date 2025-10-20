import { Stack } from "expo-router";

const CollectInfoLayout = () => {
  console.log("CollectInfoLayout rendered");
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="recap" options={{ headerShown: false }} />
    </Stack>
  );
};

export default CollectInfoLayout;
