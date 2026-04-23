import { mutation, query, action, ActionCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
import * as XLSX from "xlsx";

const TASK_API_BASE_URL =
  process.env.TASK_API_BASE_URL ?? "https://accurate-shepherd-453.convex.site";

const REPORT_TYPE_LABELS: Record<string, string> = {
  feature_optimization: "功能优化",
  bug_handling: "Bug处置",
  incident_handling: "故障处理",
  server_config: "服务器配置",
  permission_config: "权限配置",
  security_risk: "安全风险",
  security_config: "安全配置",
  third_party_integration: "三方对接",
  consultation: "咨询协助",
  data_maintenance: "数据维护统计",
  documentation: "文档编写",
};

const PLATFORM_LABELS: Record<string, string> = {
  platform_wide: "整个平台",
  ai_data_service: "AI数据服务",
  datav: "DataV",
  work_portal: "工作门户",
  core_business_platform: "核心业务平台",
  enterprise_tags: "企业标签",
  staging_db: "前置库",
  data_sharing_platform: "数据共享平台",
  data_archive_platform: "数据归档平台",
  data_feedback: "数据回流",
  data_exchange_platform: "数据交换平台",
  data_open_platform: "数据开放平台",
  data_catalog_platform: "数据目录平台",
  data_report_platform: "数据上报平台",
  data_governance_platform: "数据治理平台",
  town_warehouse: "镇街数仓",
  topic_db: "专题库",
  resource_view: "资源视窗",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  demand_form: "需求单",
  update_form: "更新单",
  bug_report: "Bug分析报告",
  incident_report: "故障分析报告",
  security_confirm: "安全风险处置确认单",
  permission_form: "权限申请表",
  cloud_resource_form: "云资源申请表",
};

const STATUS_LABELS: Record<string, string> = {
  backlog: "未排期",
  todo: "未开始",
  in_progress: "进行中",
  done: "已完成",
};

function getDocLinks(
  documentLinks: Array<{ docType: string; docNumber: string }> | undefined,
  docType: string
): string {
  if (!documentLinks) return "";
  return documentLinks
    .filter((d) => d.docType === docType)
    .map((d) => d.docNumber)
    .join(";");
}

function formatDateCN(timestamp?: number): string {
  if (!timestamp) return "未填写";
  const date = new Date(timestamp);
  return `${date.getUTCFullYear()}.${date.getUTCMonth() + 1}.${date.getUTCDate()}`;
}

function inRange(timestamp: number | null, startDate: number, endDate: number): boolean {
  if (!timestamp) return false;
  return timestamp >= startDate && timestamp <= endDate;
}

// Updated textToVector: Sum each character's code into one of 100 buckets, then normalize.
function textToVector(text: string): number[] {
  const vector = new Array(100).fill(0);
  const lower = text.toLowerCase();
  for (let i = 0; i < lower.length; i++) {
    vector[i % 100] += lower.charCodeAt(i);
  }
  // Normalize each bucket by an arbitrary factor (here 1000)
  return vector.map((val) => val / 1000);
}

export const get = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("messages"),
      _creationTime: v.number(),
      content: v.string(),
      text: v.string(),
      userId: v.optional(v.string()),
      username: v.string(),
      sender: v.optional(v.string()),
      isAi: v.optional(v.boolean()),
      threadId: v.optional(v.string()),
      timestamp: v.number(),
      likes: v.optional(v.number()),
      isComplete: v.optional(v.boolean()),
      textVector: v.optional(v.array(v.number())),
    })
  ),
  handler: async (ctx) => await ctx.db.query("messages").order("asc").collect(),
});

export const send = mutation({
  args: {
    content: v.string(),
    userId: v.string(),
    username: v.string(),
    threadId: v.optional(v.string()),
    isAi: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const vector = textToVector(args.content);
    await ctx.db.insert("messages", {
      content: args.content,
      text: args.content, // For backward compatibility
      userId: args.userId,
      username: args.username,
      sender: args.username, // For backward compatibility
      isAi: args.isAi,
      threadId: args.threadId,
      timestamp: Date.now(),
      likes: 0,
      isComplete: true,
      textVector: vector,
    });
  },
});

export const toggleLike = mutation({
  args: {
    id: v.id("messages"),
  },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    const message = await ctx.db.get(id);
    if (!message) return null;

    const currentLikes = message.likes ?? 0;
    await ctx.db.patch(id, { likes: currentLikes + 1 });
    return null;
  },
});

export const getMessagesStatus = query({
  args: {},
  returns: v.object({
    messages: v.array(
      v.object({
        _id: v.id("messages"),
        _creationTime: v.number(),
        text: v.string(),
        content: v.optional(v.string()),
        sender: v.optional(v.string()),
        timestamp: v.optional(v.number()),
        likes: v.optional(v.number()),
        textVector: v.optional(v.array(v.number())),
        isComplete: v.optional(v.boolean()),
      })
    ),
    total: v.number(),
    withVectors: v.number(),
  }),
  handler: async (ctx) => {
    const messages = await ctx.db.query("messages").collect();
    return {
      messages,
      total: messages.length,
      withVectors: messages.filter((m) => m.textVector).length,
    };
  },
});

export const searchMessages = action({
  args: {
    query: v.string(),
    pageId: v.id("pages"),
  },
  returns: v.array(v.id("pageMessages")),
  handler: async (ctx: ActionCtx, { query, pageId }): Promise<Id<"pageMessages">[]> => {
    try {
      const results = await ctx.runQuery(api.pageMessages.getMessages, { pageId });
      return results
        .filter((m) => m.text.toLowerCase().includes(query.toLowerCase()))
        .map((r) => r._id);
    } catch (error) {
      console.error("Search error:", error);
      return [];
    }
  },
});

export const searchExact = query({
  args: {
    query: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("messages"),
      _creationTime: v.number(),
      text: v.string(),
      content: v.optional(v.string()),
      sender: v.optional(v.string()),
      timestamp: v.optional(v.number()),
      likes: v.optional(v.number()),
      textVector: v.optional(v.array(v.number())),
      isComplete: v.optional(v.boolean()),
    })
  ),
  handler: async (ctx, { query }) =>
    await ctx.db
      .query("messages")
      .withSearchIndex("search_text", (q) => q.search("text", query))
      .take(5),
});

export const backfillVectors = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("textVector"), undefined))
      .collect();

    for (const message of messages) {
      if (message.text) {
        const vector = textToVector(message.text);
        await ctx.db.patch(message._id, { textVector: vector });
      }
    }

    return messages.length;
  },
});

export const checkVectors = query({
  args: {},
  returns: v.object({
    total: v.number(),
    withVectors: v.number(),
    withoutVectors: v.number(),
  }),
  handler: async (ctx) => {
    const messages = await ctx.db.query("messages").collect();
    return {
      total: messages.length,
      withVectors: messages.filter((m) => m.textVector).length,
      withoutVectors: messages.filter((m) => !m.textVector).length,
    };
  },
});

export const deleteAllMessages = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const messages = await ctx.db.query("messages").collect();
    for (const message of messages) await ctx.db.delete(message._id);

    return messages.length;
  },
});

export const deleteMessage = mutation({
  args: {
    id: v.id("messages"),
  },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
    return null;
  },
});

export const patchMessage = mutation({
  args: {
    id: v.id("messages"),
    patch: v.object({
      text: v.optional(v.string()),
      content: v.optional(v.string()),
      textVector: v.optional(v.array(v.number())),
      isComplete: v.optional(v.boolean()),
    }),
  },
  returns: v.null(),
  handler: async (ctx, { id, patch }) => {
    await ctx.db.patch(id, patch);
    return null;
  },
});

export const askAI = mutation({
  args: {
    prompt: v.string(),
    pageId: v.id("pages"),
  },
  returns: v.id("pageMessages"),
  handler: async (ctx, { prompt, pageId }) => {
    const messageId = await ctx.db.insert("pageMessages", {
      pageId,
      text: "",
      sender: "AI",
      timestamp: Date.now(),
      likes: 0,
      isComplete: false,
    });

    await ctx.scheduler.runAfter(0, api.messages.streamResponse, {
      messageId,
      prompt,
      pageId,
    });

    return messageId;
  },
});

export const streamResponse = action({
  args: {
    messageId: v.id("pageMessages"),
    prompt: v.string(),
    pageId: v.id("pages"),
  },
  returns: v.null(),
  handler: async (ctx: ActionCtx, args) => {
    const { messageId, prompt } = args;
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + process.env.OPENAI_API_KEY,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [{ role: "user", content: prompt }],
          stream: true,
        }),
      });

      if (!response.ok) throw new Error("OpenAI API请求失败: " + response.statusText);

      if (!response.body) throw new Error("响应体为空");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const json = JSON.parse(data);
              const content = json.choices[0]?.delta?.content;
              if (content) {
                text += content;
                await ctx.runMutation(api.pageMessages.patchMessage, {
                  id: messageId,
                  patch: {
                    text,
                  },
                });
              }
            } catch (e) {
              console.error("Error parsing JSON:", e);
            }
          }
        }
      }

      await ctx.runMutation(api.pageMessages.patchMessage, {
        id: messageId,
        patch: { isComplete: true },
      });
    } catch (error) {
      console.error("OpenAI API Error:", error);
      let errorMessage = "Error: Failed to get AI response";

      if (error instanceof Error) {
        if (error.message.includes("401")) errorMessage = "Error: Invalid API key";
        else if (error.message.includes("429")) errorMessage = "Error: Rate limit exceeded";
        else errorMessage = `Error: ${error.message}`;
      }

      await ctx.runMutation(api.pageMessages.patchMessage, {
        id: messageId,
        patch: {
          text: errorMessage,
          isComplete: true,
        },
      });
    }
    return null;
  },
});

export const list = query({
  args: {
    threadId: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("messages"),
      _creationTime: v.number(),
      content: v.string(),
      text: v.string(),
      userId: v.optional(v.string()),
      username: v.string(),
      sender: v.optional(v.string()),
      isAi: v.optional(v.boolean()),
      threadId: v.optional(v.string()),
      timestamp: v.number(),
      likes: v.optional(v.number()),
      isComplete: v.optional(v.boolean()),
      textVector: v.optional(v.array(v.number())),
    })
  ),
  handler: async (ctx, args) => {
    if (args.threadId)
      return await ctx.db
        .query("messages")
        .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
        .order("desc")
        .take(50);

    return await ctx.db.query("messages").order("desc").take(50);
  },
});

export const generateWeeklyReport = action({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  returns: v.object({
    report: v.string(),
    totalTasks: v.number(),
    weeklyTasks: v.number(),
    missingFieldCounts: v.object({
      proposer: v.number(),
      clientContact: v.number(),
      description: v.number(),
      proposedAt: v.number(),
      dueDate: v.number(),
      notes: v.number(),
    }),
  }),
  handler: async (_ctx: ActionCtx, args) => {
    const apiKey = process.env.TASK_API_KEY;
    if (!apiKey) throw new Error("TASK_API_KEY 未配置");

    const response = await fetch(`${TASK_API_BASE_URL}/api/tasks`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`拉取任务失败: ${response.status} ${response.statusText}`);
    }

    const payload = (await response.json()) as { tasks?: Array<any> };
    const tasks = payload.tasks ?? [];

    const weeklyTasks = tasks.filter((task) => {
      if (task.status === "todo" || task.status === "backlog" || task.status === "in_progress") {
        return true;
      }
      if (task.status === "done") {
        return (
          inRange(task.startedAt, args.startDate, args.endDate) ||
          inRange(task.completedAt, args.startDate, args.endDate)
        );
      }
      return false;
    });

    const missingFieldCounts = {
      proposer: weeklyTasks.filter((t) => !t.proposer).length,
      clientContact: weeklyTasks.filter((t) => !t.clientContact).length,
      description: weeklyTasks.filter((t) => !t.description).length,
      proposedAt: weeklyTasks.filter((t) => !t.proposedAt).length,
      dueDate: weeklyTasks.filter((t) => !t.dueDate).length,
      notes: weeklyTasks.filter((t) => !t.notes || t.notes.length === 0).length,
    };

    const grouped = new Map<string, Array<any>>();
    for (const task of weeklyTasks) {
      const label = REPORT_TYPE_LABELS[task.taskType] ?? "其他事项";
      const list = grouped.get(label) ?? [];
      list.push(task);
      grouped.set(label, list);
    }

    const featureSections: string[] = [];
    let featureIndex = 1;

    for (const [typeLabel, typeTasks] of grouped.entries()) {
      const doneCount = typeTasks.filter((t) => t.status === "done").length;
      const pendingCount = typeTasks.length - doneCount;
      featureSections.push(
        `${featureIndex}.    ${typeLabel}\n本周新增事项${typeTasks.length}条，已完成${doneCount}条，未完成${pendingCount}条。`
      );

      const platformGroups = new Map<string, Array<any>>();
      for (const task of typeTasks) {
        const platformLabel = PLATFORM_LABELS[task.subPlatform] ?? "未分类平台";
        const list = platformGroups.get(platformLabel) ?? [];
        list.push(task);
        platformGroups.set(platformLabel, list);
      }

      let platformIndex = 1;
      for (const [platformLabel, platformTasks] of platformGroups.entries()) {
        featureSections.push(`(${platformIndex})    ${platformLabel}`);
        let itemIndex = 1;
        for (const task of platformTasks) {
          const statusLabel =
            task.status === "done"
              ? "已完成"
              : task.status === "in_progress"
                ? "进行中"
                : task.status === "backlog"
                  ? "未排期"
                  : "未开始";
          const progressLabel = task.status === "in_progress" && task.progress ? `（${task.progress}%）` : "";

          const dateLabel = task.status === "done" ? "完成时间" : "计划完成时间";
          const dateValue = formatDateCN(task.dueDate);
          const docLinks = task.documentLinks
            ? task.documentLinks
                .map((doc: any) => `关联${DOC_TYPE_LABELS[doc.docType] || doc.docType}：${doc.docNumber}`)
                .join("\n")
            : "";
          const notesContent = task.notes && task.notes.length > 0
            ? task.notes.join("；")
            : "";
          featureSections.push(
            `${itemIndex})    ${task.title}\n` +
              `详细描述：${task.description ?? "待补充"}\n` +
              `提出人：${task.proposer ?? "待补充"}      业务对接人：${task.clientContact ?? "待补充"}\n` +
              `提出时间：${formatDateCN(task.proposedAt)}      ${dateLabel}：${dateValue}${docLinks ? `\n${docLinks}` : ""}` +
              (notesContent ? `\n情况说明：${notesContent}` : "")
          );
          itemIndex += 1;
        }
        platformIndex += 1;
      }

      featureIndex += 1;
    }

    const unfinishedTasks = weeklyTasks.filter((task) => task.status !== "done");
    const periodText = `${formatDateCN(args.startDate)}-${formatDateCN(args.endDate)}`;

    const report =
      `平台运维周报\n` +
      `项目名称：丽水市公共数据平台运维服务项目\n` +
      `编    号：PTYW-ZB-${new Date(args.endDate).toISOString().slice(0, 10).replace(/-/g, "")}\n` +
      `单位名称：中国电信股份有限公司丽水分公司    日期：${periodText}\n` +
`运维工作小组成员：陈叶春、毛炜勇、吴津津、王翀、方舟琼、周晨、卓江南\n` +
      `一、本周工作内容：\n` +
      (featureSections.length > 0 ? `${featureSections.join("\n")}\n` : "本周暂无任务数据。\n") +
      `二、下周工作计划：\n` +
      (unfinishedTasks.length > 0
        ? unfinishedTasks.slice(0, 10).map((task, idx) => {
            const platformLabel = PLATFORM_LABELS[task.subPlatform] ?? "未分类平台";
            const statusLabel = task.status === "in_progress" ? "进行中" : "待处理";
            return `${idx + 1}.    [${platformLabel}] ${task.title}（${statusLabel}）`;
          }).join("\n") + "\n"
        : "暂无未完成事项，按计划开展例行巡检与优化。\n") +
      `三、待协调事项\n` +
      `暂无\n`;

    return {
      report,
      totalTasks: tasks.length,
      weeklyTasks: weeklyTasks.length,
      missingFieldCounts,
    };
  },
});

export const exportAllTasksToExcel = action({
  args: {},
  returns: v.string(),
  handler: async (_ctx: ActionCtx): Promise<string> => {
    const apiKey = process.env.TASK_API_KEY;
    if (!apiKey) throw new Error("TASK_API_KEY 未配置");

    const response = await fetch(`${TASK_API_BASE_URL}/api/tasks`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`拉取任务失败: ${response.status} ${response.statusText}`);
    }

    const payload = (await response.json()) as { tasks?: Array<any> };
    const tasks = payload.tasks ?? [];

    const rows = [
      [
        "标题",
        "详细描述",
        "任务类型",
        "子平台",
        "所属区县",
        "状态",
        "提出人",
        "业务对接人",
        "创建时间",
        "提出时间",
        "响应时间",
        "计划完成时间",
        "实际开始时间",
        "实际完成时间",
        "进度",
        "关联需求单",
        "关联更新单",
        "关联Bug报告",
        "关联故障报告",
        "关联安全确认单",
        "关联权限申请表",
        "关联云资源申请表",
        "情况说明",
      ],
    ];

    const DISTRICT_LABELS: Record<string, string> = {
      city_level: "市本级",
      development_zone: "开发区",
      liandu: "莲都区",
      qingtian: "青田县",
      jinyun: "缙云县",
      suichang: "遂昌县",
      songyang: "松阳县",
      yunhe: "云和县",
      qingtian_county: "庆元县",
      jinglong: "景宁县",
      longquan: "龙泉市",
    };

    for (const task of tasks) {
      const demandLinks = getDocLinks(task.documentLinks, "demand_form");
      const updateLinks = getDocLinks(task.documentLinks, "update_form");
      const bugLinks = getDocLinks(task.documentLinks, "bug_report");
      const incidentLinks = getDocLinks(task.documentLinks, "incident_report");
      const securityLinks = getDocLinks(task.documentLinks, "security_confirm");
      const permissionLinks = getDocLinks(task.documentLinks, "permission_form");
      const cloudLinks = getDocLinks(task.documentLinks, "cloud_resource_form");
      const notesContent = task.notes?.join(";") ?? "";

      rows.push([
        task.title ?? "",
        task.description ?? "",
        REPORT_TYPE_LABELS[task.taskType] ?? task.taskType ?? "",
        PLATFORM_LABELS[task.subPlatform] ?? task.subPlatform ?? "",
        DISTRICT_LABELS[task.district] ?? task.district ?? "",
        STATUS_LABELS[task.status] ?? task.status ?? "",
        task.proposer ?? "",
        task.clientContact ?? "",
        formatDateCN(task.createdAt),
        formatDateCN(task.proposedAt),
        formatDateCN(task.respondedAt),
        formatDateCN(task.dueDate),
        formatDateCN(task.startedAt),
        formatDateCN(task.completedAt),
        task.progress ? `${task.progress}%` : "",
        demandLinks,
        updateLinks,
        bugLinks,
        incidentLinks,
        securityLinks,
        permissionLinks,
        cloudLinks,
        notesContent,
      ]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "任务列表");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const binary = new Uint8Array(excelBuffer);
    let binaryString = "";
    for (let i = 0; i < binary.byteLength; i++) {
      binaryString += String.fromCharCode(binary[i]);
    }
    return btoa(binaryString);
  },
});
