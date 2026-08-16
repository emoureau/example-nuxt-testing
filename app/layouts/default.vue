<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'

const open = useSidebarOpen()

const colorMode = useColorMode()

const THEMES = [
  { value: 'system', label: 'System', icon: 'i-mdi-monitor' },
  { value: 'light', label: 'Light', icon: 'i-mdi-white-balance-sunny' },
  { value: 'dark', label: 'Dark', icon: 'i-mdi-weather-night' },
] as const

/**
 * `preference` is the stored choice ('system' included); `value` is what that resolves
 * to right now. The menu checks against `preference`, or picking System would put the
 * tick next to Light or Dark instead of System.
 */
const themeItems = computed<DropdownMenuItem[][]>(() => [
  [{ label: 'Theme', type: 'label' }],
  THEMES.map(theme => ({
    label: theme.label,
    icon: theme.icon,
    type: 'checkbox' as const,
    checked: colorMode.preference === theme.value,
    onUpdateChecked: () => {
      colorMode.preference = theme.value
    },
  })),
])

const items: NavigationMenuItem[] = [
  {
    label: 'Search',
    icon: 'i-mdi-magnify',
    to: '/',
  },
  {
    label: 'Import',
    icon: 'i-mdi-file-delimited-outline',
    to: '/import',
  },
]
</script>

<template>
  <!-- `h-svh` is what makes the shell a fixed frame rather than a growing page:
       the sidebar is `fixed`, so it contributes no height, and without this the
       whole app grew with its content and the window scrolled — which quietly
       defeats every sticky toolbar and rail inside a page. -->
  <div class="flex h-svh bg-default">
    <!-- `title` is never painted here (the `#header` slot below replaces it),
         but it names the mobile slideover for screen readers. -->
    <USidebar
      v-model:open="open"
      collapsible="icon"
      :ui="{
        container: 'h-full',
      }"
    >
      <template #header>
        <div class="flex justify-between items-center w-full">
          <!-- `flex-1 min-w-0` is the whole trick: the title takes no width of its
               own, so it is squeezed by the header shrinking with the sidebar's
               own width transition. Animating its `max-width` in parallel instead
               only ever *approximates* that curve, and drifts out of step. Opacity
               is the one thing left to transition, since nothing else drives it. -->
          <span
            class="flex-1 min-w-0 overflow-hidden whitespace-nowrap text-base font-semibold transition-opacity duration-200 ease-out motion-reduce:transition-none"
            :class="open ? 'opacity-100' : 'opacity-0'"
            :aria-hidden="!open"
          >Test That!</span>
          <UButton
            icon="i-mdi-dock-left"
            color="neutral"
            variant="ghost"
            aria-label="Toggle sidebar"
            class="shrink-0"
            @click="open = !open"
          />
        </div>
      </template>

      <UNavigationMenu
        :items="items"
        orientation="vertical"
        :ui="{ link: 'my-1 p-1.5 overflow-hidden' }"
      />

      <template #footer>
        <!-- Opens upward and aligned to the rail so the menu clears the sidebar edge
             in both the expanded and icon-collapsed widths. -->
        <UDropdownMenu
          :items="themeItems"
          :content="{ side: 'top', align: 'start' }"
          :ui="{ content: 'w-40' }"
          class="w-full"
        >
          <!-- `justify-start` unconditionally: at the collapsed rail width the
               footer's content box is exactly the button's own 2rem, so the icon
               lands centred anyway. Toggling `justify-center` snapped it into
               place in one frame while the sidebar was still 200ms from done.

               `p-1.5` is pinned explicitly because adding a label turns off the
               component's `square` variant, which was the only reason it had
               even padding. Keeping it stated here means the hover rect is the
               same full-width, evenly-padded box whether the label shows or not.

               `aria-label` stays, and stays the accessible name in both states —
               the label below is clipped rather than removed, so it must not be
               what the button is named by. -->
          <UButton
            icon="i-mdi-cog"
            color="neutral"
            variant="ghost"
            aria-label="Settings"
            class="w-full justify-start p-1.5 overflow-hidden"
          >
            <!-- Squeezed by the sidebar's width transition, exactly like the
                 header title: no width of its own, so it cannot drift out of
                 step. The 6px button gap overflows to the right and is clipped,
                 which leaves the icon pinned where `justify-start` put it. -->
            <span
              class="flex-1 min-w-0 overflow-hidden whitespace-nowrap text-left transition-opacity duration-200 ease-out motion-reduce:transition-none"
              :class="open ? 'opacity-100' : 'opacity-0'"
            >Settings</span>
          </UButton>
        </UDropdownMenu>
      </template>
    </USidebar>

    <main id="maincontent" tabindex="-1" class="flex-1 flex flex-col overflow-hidden lg:peer-data-[variant=floating]:my-4 peer-data-[variant=inset]:m-4 lg:peer-data-[variant=inset]:not-peer-data-[collapsible=offcanvas]:ms-0 peer-data-[variant=inset]:rounded-xl peer-data-[variant=inset]:shadow-sm peer-data-[variant=inset]:ring peer-data-[variant=inset]:ring-default bg-default">
      <!-- The whole page -->
      <slot />
    </main>
  </div>
</template>
