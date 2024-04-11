<template>
  <div :style="style">
    <VueLivePreview :code="code" :components="components" />
  </div>
</template>

<script setup>
import { ref, defineProps } from 'vue'
import { VueLivePreview } from 'vue-live-preview-only-fork'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './components/ui/accordion'
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar'
import { Badge } from './components/ui/badge'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { ScrollArea } from './components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from './components/ui/select'

defineProps({
  code: {
    type: String,
    default: ''
  },
  style: {
    type: String,
    default: ''
  }
})

const components = ref({
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Input,
  ScrollArea,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
})
</script>