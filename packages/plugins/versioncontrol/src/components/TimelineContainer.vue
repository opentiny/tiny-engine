<template>
  <div class="timeline-container">
    <div class="timeline-header">
      <h3>提交时间线</h3>
      <div class="timeline-controls">
        <button @click="timelineView = 'compact'" :class="{ active: timelineView === 'compact' }" class="view-toggle">
          紧凑
        </button>
        <button @click="timelineView = 'detailed'" :class="{ active: timelineView === 'detailed' }" class="view-toggle">
          详细
        </button>
      </div>
    </div>

    <div class="timeline-content" :class="timelineView">
      <div
        v-for="(commit, index) in filteredCommits"
        :key="commit.hash"
        class="timeline-item"
        :class="{
          selected: selectedCommit?.hash === commit.hash,
          'merge-item': commit.type === 'merge'
        }"
        @click="selectCommit(commit)"
      >
        <!-- 分支线 -->
        <div class="timeline-line">
          <div class="timeline-dot" :class="getCommitTypeClass(commit)">
            <!-- 合并提交图标 -->
            <svg v-if="commit.type === 'merge'" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 16l2.879-2.879a3 3 0 0 1 4.242 0L18 16M8 8l2.879 2.879a3 3 0 0 1 4.242 0L18 8" />
            </svg>
            <!-- 标签提交图标 -->
            <svg v-else-if="commit.tags && commit.tags.length > 0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            </svg>
            <!-- 普通提交点 -->
            <div v-else class="commit-dot"></div>
          </div>
          <!-- 连接线 -->
          <div
            v-if="index < filteredCommits.length - 1"
            class="timeline-connector"
            :class="getConnectorClass(commit, filteredCommits[index + 1])"
          ></div>
        </div>

        <!-- 提交信息预览 -->
        <div class="timeline-info">
          <div class="commit-hash-mini">{{ commit.hash.slice(0, 7) }}</div>
          <div class="commit-time">{{ formatTime(commit.date) }}</div>
          <div v-if="timelineView === 'detailed'" class="commit-message-mini">
            {{ commit.message.slice(0, 30) }}{{ commit.message.length > 30 ? '...' : '' }}
          </div>
          <div v-if="commit.tags && commit.tags.length > 0" class="commit-tags-mini">
            <span v-for="tag in commit.tags.slice(0, 2)" :key="tag" class="tag-mini">{{ tag }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'

const props = defineProps({
  timelineView: String,
  filteredCommits: Array,
  selectedCommit: Object
})

const emit = defineEmits(['update:timelineView', 'selectCommit'])

const timelineView = computed({
  get: () => props.timelineView,
  set: (value) => emit('update:timelineView', value)
})

const selectCommit = (commit) => {
  emit('selectCommit', commit)
}

const formatTime = (dateString) => {
  const options = { hour: '2-digit', minute: '2-digit' }
  return new Date(dateString).toLocaleTimeString('zh-CN', options)
}

const getCommitTypeClass = (commit) => {
  return {
    'merge-commit': commit.type === 'merge',
    'tag-commit': commit.tags && commit.tags.length > 0,
    'feature-commit': commit.type === 'feature',
    'bugfix-commit': commit.type === 'bugfix',
    'docs-commit': commit.type === 'docs',
    'refactor-commit': commit.type === 'refactor',
    'style-commit': commit.type === 'style',
    'test-commit': commit.type === 'test',
    'perf-commit': commit.type === 'perf',
    'build-commit': commit.type === 'build',
    'release-commit': commit.type === 'release',
    'chore-commit': commit.type === 'chore'
  }
}

const getConnectorClass = (currentCommit, nextCommit) => {
  if (!nextCommit) return ''

  if (currentCommit.type === 'merge' || nextCommit.type === 'merge') {
    return 'merge-connector'
  }
  return 'normal-connector'
}
</script>

<style lang="less">
.timeline-container {
  width: 320px;
  border-right: 1px solid #e5e7eb;
  background: #fafafa;
  display: flex;
  flex-direction: column;

  .timeline-header {
    padding: 16px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      font-size: 16px;
      color: #1f2937;
      font-weight: 600;
    }

    .timeline-controls {
      display: flex;
      gap: 4px;

      .view-toggle {
        padding: 4px 8px;
        border: 1px solid #d1d5db;
        background: white;
        color: #6b7280;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;

        &:first-child {
          border-radius: 4px 0 0 4px;
        }

        &:last-child {
          border-radius: 0 4px 4px 0;
          border-left: none;
        }

        &.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        &:hover:not(.active) {
          background: #f3f4f6;
        }
      }
    }
  }

  .timeline-content {
    flex: 1;
    overflow-y: auto;
    padding: 8px;

    &.detailed .timeline-item {
      .timeline-info {
        .commit-message-mini {
          display: block;
        }
      }
    }

    .timeline-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 10px 8px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 4px;

      &:hover {
        background: rgba(59, 130, 246, 0.05);
        transform: translateX(2px);
      }

      &.selected {
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid #3b82f6;
        transform: translateX(4px);
      }

      &.merge-item {
        background: rgba(139, 92, 246, 0.05);

        &:hover {
          background: rgba(139, 92, 246, 0.1);
        }

        &.selected {
          background: rgba(139, 92, 246, 0.15);
          border-color: #8b5cf6;
        }
      }

      .timeline-line {
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;

        .timeline-dot {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 2;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

          &.merge-commit {
            background: #8b5cf6;
            color: white;
          }

          &.tag-commit {
            background: #f59e0b;
            color: white;
          }

          &.feature-commit {
            background: #10b981;
            color: white;
          }

          &.bugfix-commit {
            background: #ef4444;
            color: white;
          }

          &.docs-commit {
            background: #6b7280;
            color: white;
          }

          &.refactor-commit {
            background: #3b82f6;
            color: white;
          }

          &.style-commit {
            background: #ec4899;
            color: white;
          }

          &.test-commit {
            background: #84cc16;
            color: white;
          }

          &.perf-commit {
            background: #fef9c3;
            color: #854d0e;
          }

          &.build-commit {
            background: #cffafe;
            color: #155e75;
          }

          &.release-commit {
            background: #ec4899;
            color: white;
          }

          &.chore-commit {
            background: #f5f5f5;
            color: #44403c;
          }

          svg {
            width: 14px;
            height: 14px;
          }

          .commit-dot {
            width: 10px;
            height: 10px;
            background: #d1d5db;
            border-radius: 50%;
          }
        }

        .timeline-connector {
          width: 2px;
          height: 40px;
          background: #e5e7eb;
          margin-top: 4px;

          &.merge-connector {
            background: linear-gradient(to bottom, #8b5cf6, #e5e7eb);
          }

          &.normal-connector {
            background: #e5e7eb;
          }
        }
      }

      .timeline-info {
        flex: 1;
        min-width: 0;

        .commit-hash-mini {
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 2px;
          font-weight: 600;
        }

        .commit-time {
          font-size: 12px;
          color: #9ca3af;
          margin-bottom: 4px;
        }

        .commit-message-mini {
          display: none;
          font-size: 12px;
          color: #374151;
          margin-bottom: 4px;
          line-height: 1.3;
        }

        .commit-tags-mini {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;

          .tag-mini {
            background: #fef3c7;
            color: #92400e;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 500;
          }
        }
      }
    }
  }
}
</style>
