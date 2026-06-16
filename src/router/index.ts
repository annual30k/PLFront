import { createWebHistory, createRouter, RouteRecordRaw } from 'vue-router';
/* Layout */
import Layout from '@/layout/index.vue';
import ParentView from '@/components/ParentView/index.vue';

/**
 * Note: 路由配置项
 *
 * hidden: true                     // 当设置 true 的时候该路由不会再侧边栏出现 如401，login等页面，或者如一些编辑页面/edit/1
 * alwaysShow: true                 // 当你一个路由下面的 children 声明的路由大于1个时，自动会变成嵌套的模式--如组件页面
 *                                  // 只有一个时，会将那个子路由当做根路由显示在侧边栏--如引导页面
 *                                  // 若你想不管路由下面的 children 声明的个数都显示你的根路由
 *                                  // 你可以设置 alwaysShow: true，这样它就会忽略之前定义的规则，一直显示根路由
 * redirect: noRedirect             // 当设置 noRedirect 的时候该路由在面包屑导航中不可被点击
 * name:'router-name'               // 设定路由的名字，一定要填写不然使用<keep-alive>时会出现各种问题
 * query: '{"id": 1, "name": "ry"}' // 访问路由的默认传递参数
 * roles: ['admin', 'common']       // 访问路由的角色权限
 * permissions: ['a:a:a', 'b:b:b']  // 访问路由的菜单权限
 * meta : {
    noCache: true                   // 如果设置为true，则不会被 <keep-alive> 缓存(默认 false)
    title: 'title'                  // 设置该路由在侧边栏和面包屑中展示的名字
    icon: 'svg-name'                // 设置该路由的图标，对应路径src/assets/icons/svg
    breadcrumb: false               // 如果设置为false，则不会在breadcrumb面包屑中显示
    activeMenu: '/system/user'      // 当路由设置了该属性，则会高亮相对应的侧边栏。
  }
 */

// 公共路由
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/patrol/dispatch',
    redirect: '/patrol/video-wall',
    meta: { public: true, title: '电视墙' },
    hidden: true
  },
  {
    path: '/patrol/video-wall',
    component: () => import('@/views/patrol/video-wall/index.vue'),
    meta: { public: true, title: '电视墙' },
    hidden: true
  },
  {
    path: '/redirect',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '/redirect/:path(.*)',
        component: () => import('@/views/redirect/index.vue')
      }
    ]
  },
  {
    path: '/social-callback',
    hidden: true,
    component: () => import('@/layout/components/SocialCallback/index.vue')
  },
  {
    path: '/login',
    component: () => import('@/views/login.vue'),
    hidden: true
  },
  {
    path: '/register',
    component: () => import('@/views/register.vue'),
    hidden: true
  },
  {
    path: '/:pathMatch(.*)*',
    component: () => import('@/views/error/404.vue'),
    hidden: true
  },
  {
    path: '/401',
    component: () => import('@/views/error/401.vue'),
    hidden: true
  },
  {
    path: '',
    component: Layout,
    redirect: '/index',
    children: [
      {
        path: '/index',
        component: () => import('@/views/index.vue'),
        name: 'Index',
        meta: { title: '首页', icon: 'dashboard', affix: true }
      }
    ]
  },
  {
    path: '/patrol',
    component: Layout,
    redirect: '/patrol/dashboard',
    alwaysShow: true,
    name: 'Patrol',
    meta: { title: '指挥后台', icon: 'monitor' },
    children: [
      {
        path: 'dashboard',
        component: () => import('@/views/patrol/dashboard/index.vue'),
        name: 'PatrolDashboard',
        meta: { title: '工作台', icon: 'dashboard' }
      },
      {
        path: 'video-wall',
        component: () => import('@/views/patrol/video-wall/index.vue'),
        name: 'PatrolVideoWall',
        meta: { title: '电视墙', icon: 'component' }
      },
      {
        path: 'map',
        component: () => import('@/views/patrol/map/index.vue'),
        name: 'PatrolMap',
        meta: { title: '警力一张图', icon: 'online' }
      },
      {
        path: 'alerts',
        component: () => import('@/views/patrol/alerts/index.vue'),
        name: 'PatrolAlerts',
        meta: { title: '布控预警', icon: 'message' }
      },
      {
        path: 'devices',
        component: () => import('@/views/patrol/devices/index.vue'),
        name: 'PatrolDevices',
        meta: { title: '设备管理', icon: 'phone' }
      },
      {
        path: 'media',
        component: ParentView,
        name: 'PatrolMedia',
        redirect: '/patrol/media/overview',
        meta: { title: '媒体证据', icon: 'upload' },
        children: [
          {
            path: 'overview',
            component: () => import('@/views/patrol/media/index.vue'),
            name: 'PatrolMediaOverview',
            meta: { title: '媒体总览', icon: 'upload' }
          },
          {
            path: 'evidence',
            component: () => import('@/views/patrol/media/evidence/index.vue'),
            name: 'PatrolMediaEvidence',
            meta: { title: '证据库', icon: 'documentation' }
          },
          {
            path: 'upload-tasks',
            component: () => import('@/views/patrol/media/upload-tasks/index.vue'),
            name: 'PatrolMediaUploadTasks',
            meta: { title: '上传任务', icon: 'list' }
          }
        ]
      },
      {
        path: 'reports',
        component: () => import('@/views/patrol/reports/index.vue'),
        name: 'PatrolReports',
        meta: { title: '日报管理', icon: 'documentation' }
      },
      {
        path: 'sos',
        component: () => import('@/views/patrol/sos/index.vue'),
        name: 'PatrolSos',
        meta: { title: 'SOS 求助', icon: 'bug' }
      },
      {
        path: 'control',
        component: ParentView,
        name: 'PatrolControl',
        redirect: '/patrol/control/overview',
        meta: { title: '人员车辆布控', icon: 'peoples' },
        children: [
          {
            path: 'overview',
            component: () => import('@/views/patrol/control/index.vue'),
            name: 'PatrolControlOverview',
            meta: { title: '布控总览', icon: 'peoples' }
          },
          {
            path: 'persons',
            component: () => import('@/views/patrol/control/persons/index.vue'),
            name: 'PatrolControlPersons',
            meta: { title: '人员布控', icon: 'user' }
          },
          {
            path: 'vehicles',
            component: () => import('@/views/patrol/control/vehicles/index.vue'),
            name: 'PatrolControlVehicles',
            meta: { title: '车辆布控', icon: 'phone' }
          }
        ]
      },
      {
        path: 'messages',
        component: ParentView,
        name: 'PatrolMessages',
        redirect: '/patrol/messages/overview',
        meta: { title: '消息通知', icon: 'message' },
        children: [
          {
            path: 'overview',
            component: () => import('@/views/patrol/messages/index.vue'),
            name: 'PatrolMessagesOverview',
            meta: { title: '消息总览', icon: 'message' }
          },
          {
            path: 'send',
            component: () => import('@/views/patrol/messages/send/index.vue'),
            name: 'PatrolMessagesSend',
            meta: { title: '发送消息', icon: 'edit' }
          },
          {
            path: 'history',
            component: () => import('@/views/patrol/messages/history/index.vue'),
            name: 'PatrolMessagesHistory',
            meta: { title: '消息流水', icon: 'list' }
          }
        ]
      },
      {
        path: 'statistics',
        component: () => import('@/views/patrol/statistics/index.vue'),
        name: 'PatrolStatistics',
        meta: { title: '统计分析', icon: 'chart' }
      },
      {
        path: 'audit',
        component: () => import('@/views/patrol/audit/index.vue'),
        name: 'PatrolAudit',
        meta: { title: '审计日志', icon: 'log' }
      },
      {
        path: 'operations',
        component: ParentView,
        name: 'PatrolOperations',
        redirect: '/patrol/operations/overview',
        meta: { title: '运维监控', icon: 'server' },
        children: [
          {
            path: 'overview',
            component: () => import('@/views/patrol/operations/index.vue'),
            name: 'PatrolOperationsOverview',
            meta: { title: '运维总览', icon: 'server' }
          },
          {
            path: 'app-versions',
            component: () => import('@/views/patrol/operations/app-versions/index.vue'),
            name: 'PatrolOperationAppVersions',
            meta: { title: 'App 版本', icon: 'upload' }
          },
          {
            path: 'firmware-versions',
            component: () => import('@/views/patrol/operations/firmware-versions/index.vue'),
            name: 'PatrolOperationFirmwareVersions',
            meta: { title: '设备固件', icon: 'build' }
          },
          {
            path: 'firmware-upgrade-tasks',
            component: () => import('@/views/patrol/operations/firmware-upgrade-tasks/index.vue'),
            name: 'PatrolOperationFirmwareUpgradeTasks',
            meta: { title: '升级记录', icon: 'list' }
          },
          {
            path: 'capabilities',
            component: () => import('@/views/patrol/operations/capabilities/index.vue'),
            name: 'PatrolOperationCapabilities',
            meta: { title: '能力监控', icon: 'monitor' }
          }
        ]
      }
    ]
  },
  {
    path: '/user',
    component: Layout,
    hidden: true,
    redirect: 'noredirect',
    children: [
      {
        path: 'profile',
        component: () => import('@/views/system/user/profile/index.vue'),
        name: 'Profile',
        meta: { title: '个人中心', icon: 'user' }
      }
    ]
  }
];

// 动态路由，基于用户权限动态去加载
export const dynamicRoutes: RouteRecordRaw[] = [];

/**
 * 创建路由
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_APP_CONTEXT_PATH),
  routes: constantRoutes,
  // 刷新时，滚动条位置还原
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0 };
  }
});

export default router;
