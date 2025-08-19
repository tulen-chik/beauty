"use client"

import type { ReactNode } from "react"

// Типы для контента
export interface ContentBlock {
  type: string
  [key: string]: any
}

interface BlogContentProps {
  content: ContentBlock[]
}

// Компонент параграфа
function Paragraph({ content, className = "" }: { content: string; className?: string }) {
  return <p className={`text-lg text-gray-700 leading-relaxed mb-6 font-medium ${className}`}>{content}</p>
}

// Компонент заголовка
function Heading({ level, content }: { level: number; content: string }) {
  const baseClasses = "font-bold text-gray-900 mt-8 mb-4"

  switch (level) {
    case 2:
      return <h2 className={`text-2xl ${baseClasses}`}>{content}</h2>
    case 3:
      return <h3 className={`text-xl ${baseClasses} mt-6 mb-3`}>{content}</h3>
    case 4:
      return <h4 className={`text-lg ${baseClasses} mt-4 mb-2`}>{content}</h4>
    default:
      return <h2 className={`text-2xl ${baseClasses}`}>{content}</h2>
  }
}

// Компонент списка
function List({ items, ordered = false }: { items: string[]; ordered?: boolean }) {
  const ListTag = ordered ? "ol" : "ul"
  const listClass = ordered ? "list-decimal" : "list-disc"

  return (
    <ListTag className={`${listClass} list-inside mb-6 text-gray-700 font-medium`}>
      {items.map((item, index) => (
        <li key={index} className="mb-1">
          {item}
        </li>
      ))}
    </ListTag>
  )
}

// Компонент совета/подсказки
function Tip({ title, content, color = "rose" }: { title: string; content: string; color?: string }) {
  const colorClasses = {
    rose: "bg-rose-50 border-rose-500 text-rose-500",
    pink: "bg-pink-50 border-pink-500 text-pink-500",
    blue: "bg-blue-50 border-blue-500 text-blue-500",
    green: "bg-green-50 border-green-500 text-green-500",
    yellow: "bg-yellow-50 border-yellow-500 text-yellow-500",
  }

  return (
    <div
      className={`${colorClasses[color as keyof typeof colorClasses]?.split(" ")[0] || "bg-rose-50"} border-l-4 ${colorClasses[color as keyof typeof colorClasses]?.split(" ")[1] || "border-rose-500"} p-6 my-8`}
    >
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-700 font-medium">{content}</p>
    </div>
  )
}

// Компонент информационного блока
function InfoBox({ title, items, color = "gray" }: { title: string; items: string[]; color?: string }) {
  const colorClasses = {
    gray: "bg-gray-50 border-gray-200",
    green: "bg-green-50 border-green-200",
    yellow: "bg-yellow-50 border-yellow-200",
    blue: "bg-blue-50 border-blue-200",
    rose: "bg-rose-50 border-rose-200",
  }

  return (
    <div
      className={`${colorClasses[color as keyof typeof colorClasses] || "bg-gray-50 border-gray-200"} border rounded-lg p-6 mb-6`}
    >
      <h3 className="text-lg font-bold text-gray-900 mb-3">{title}</h3>
      <ul className="text-gray-700 font-medium list-disc list-inside space-y-1">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

// Компонент рейтинга продукта
function ProductRating({
  name,
  rating,
  description,
  color = "green",
}: {
  name: string
  rating: string
  description: string
  color?: string
}) {
  const colorClasses = {
    green: "bg-green-50 border-green-200 text-green-800",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-800",
    red: "bg-red-50 border-red-200 text-red-800",
  }

  return (
    <div
      className={`${colorClasses[color as keyof typeof colorClasses] || "bg-green-50 border-green-200"} border rounded-lg p-4 mb-4`}
    >
      <h3 className="text-xl font-bold text-gray-900 mb-3">{name}</h3>
      <p
        className={`font-semibold mb-2 ${colorClasses[color as keyof typeof colorClasses]?.split(" ")[2] || "text-green-800"}`}
      >
        ⭐ {rating}
      </p>
      <p className="text-gray-700 font-medium">{description}</p>
    </div>
  )
}

// Компонент разделителя
function Divider() {
  return <div className="w-full h-px bg-gray-200 my-8" />
}

// Компонент цитаты
function Quote({ content }: { content: string }) {
  return (
    <blockquote className="border-l-4 border-rose-500 pl-6 my-8 italic">
      <p className="text-lg text-gray-700 font-medium mb-2">"{content}"</p>
    </blockquote>
  )
}

// Компонент шагов (для туториалов)
function Steps({ steps }: { steps: string[] }) {
  return (
    <ol className="list-decimal list-inside mb-6 text-gray-700 font-medium space-y-2">
      {steps.map((step, index) => (
        <li key={index} className="pl-2">
          {step}
        </li>
      ))}
    </ol>
  )
}

// Основной компонент для рендеринга контента
export default function BlogContent({ content }: BlogContentProps) {
  const renderBlock = (block: ContentBlock, index: number): ReactNode => {
    switch (block.type) {
      case "paragraph":
        return <Paragraph key={index} content={block.content} className={block.className} />

      case "heading":
        return <Heading key={index} level={block.level} content={block.content} />

      case "list":
        return <List key={index} items={block.items} ordered={block.ordered} />

      case "tip":
        return <Tip key={index} title={block.title} content={block.content} color={block.color} />

      case "infoBox":
        return <InfoBox key={index} title={block.title} items={block.items} color={block.color} />

      case "productRating":
        return (
          <ProductRating
            key={index}
            name={block.name}
            rating={block.rating}
            description={block.description}
            color={block.color}
          />
        )

      case "divider":
        return <Divider key={index} />

      case "quote":
        return <Quote key={index} content={block.content} />

      case "steps":
        return <Steps key={index} steps={block.steps} />

      default:
        return null
    }
  }

  return <div className="prose prose-lg max-w-none">{content.map((block, index) => renderBlock(block, index))}</div>
}
