import * as React from "react";
import { useEffect, useState } from 'react'
import { Modal, Tabs } from 'antd'
import type { ReactNode } from 'react'

interface ChartModalProps {
  title: string
  open: boolean
  onClose: () => void
  chart: ReactNode
  table: ReactNode
  defaultTab?: 'chart' | 'table'
}

export default function ChartModal({ title, open, onClose, chart, table, defaultTab = 'chart' }: ChartModalProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  useEffect(() => {
    if (open) setActiveTab(defaultTab)
  }, [open, defaultTab])

  return (
    <Modal
      title={title}
      visible={open}
      onCancel={onClose}
      footer={null}
      width={960}
      bodyStyle={{ maxHeight: '75vh', overflow: 'auto' }}
    >
      <Tabs
        size="small"
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as 'chart' | 'table')}
      >
        <Tabs.TabPane key="chart" tab="Chart">{chart}</Tabs.TabPane>
        <Tabs.TabPane key="table" tab="Table">{table}</Tabs.TabPane>
      </Tabs>
    </Modal>
  )
}
