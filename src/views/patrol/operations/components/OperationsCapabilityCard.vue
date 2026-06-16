<template>
  <el-card shadow="never">
    <template #header>运维能力</template>
    <el-descriptions :column="2" border>
      <el-descriptions-item label="数据库">MySQL 8 / 达梦 DM8 / 人大金仓 KingbaseES V8</el-descriptions-item>
      <el-descriptions-item label="缓存">Redis + Redisson，支持单机、哨兵、集群</el-descriptions-item>
      <el-descriptions-item label="对象存储">MinIO，证据文件预签名访问</el-descriptions-item>
      <el-descriptions-item label="部署">Docker Compose 起步，生产支持多实例</el-descriptions-item>
      <el-descriptions-item label="流媒体">独立媒体节点，业务后端只管理会话和鉴权</el-descriptions-item>
      <el-descriptions-item label="第三方">人脸比对、车牌 OCR、110 接处警接口预留</el-descriptions-item>
    </el-descriptions>
  </el-card>
</template>
