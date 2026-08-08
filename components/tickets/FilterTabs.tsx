import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import Animated, {

  useAnimatedStyle,

  useSharedValue,

  withSpring,

} from 'react-native-reanimated';



import { Colors } from '@/constants/colors';

import { Radius, Spacing } from '@/constants/spacing';

import { Typography } from '@/constants/typography';

import { useTheme } from '@/hooks/use-theme';



export type FilterTabItem<T extends string = string> = {

  key: T;

  label: string;

  count?: number;

};



interface FilterTabsProps<T extends string> {

  tabs: FilterTabItem<T>[];

  activeKey: T;

  onChange: (key: T) => void;

}



const AnimatedPressable = Animated.createAnimatedComponent(Pressable);



export function FilterTabs<T extends string>({ tabs, activeKey, onChange }: FilterTabsProps<T>) {

  const theme = useTheme();



  return (

    <ScrollView

      horizontal

      showsHorizontalScrollIndicator={false}

      contentContainerStyle={styles.row}

    >

      {tabs.map((tab) => (

        <FilterChip

          key={tab.key}

          label={tab.count != null ? `${tab.label} (${tab.count})` : tab.label}

          selected={tab.key === activeKey}

          onPress={() => onChange(tab.key)}

          borderColor={theme.border}

          cardColor={theme.card}

          textColor={theme.text}

        />

      ))}

    </ScrollView>

  );

}



function FilterChip({

  label,

  selected,

  onPress,

  borderColor,

  cardColor,

  textColor,

}: {

  label: string;

  selected: boolean;

  onPress: () => void;

  borderColor: string;

  cardColor: string;

  textColor: string;

}) {

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({

    transform: [{ scale: scale.value }],

  }));



  return (

    <AnimatedPressable

      onPress={onPress}

      onPressIn={() => {

        scale.value = withSpring(0.96);

      }}

      onPressOut={() => {

        scale.value = withSpring(1);

      }}

      style={[

        styles.chip,

        animatedStyle,

        {

          backgroundColor: selected ? Colors.primary : cardColor,

          borderColor: selected ? Colors.primary : borderColor,

        },

      ]}

    >

      <Text style={[styles.label, { color: selected ? Colors.textInverse : textColor }]}>

        {label}

      </Text>

    </AnimatedPressable>

  );

}



const styles = StyleSheet.create({

  row: {

    gap: Spacing.sm,

    paddingVertical: Spacing.xs,

  },

  chip: {

    paddingHorizontal: Spacing.md,

    paddingVertical: Spacing.sm + 2,

    borderRadius: Radius.full,

    borderWidth: 1.5,

  },

  label: {

    ...Typography.small,

  },

});

