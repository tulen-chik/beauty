"use client"

import { motion } from "framer-motion"
import {
  CalendarCheck,
  CheckCircle,
  Heart,
  MessageCircle,
  Scissors,
  ShieldCheck,
  Sparkles,
  Star,
  User,
  Users,
  ArrowRight,
  ChevronDown
} from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import FAQ from "@/components/FAQ"
import StructuredData from "@/components/StructuredData"

export default function Home() {
  const t = useTranslations("home")

  // Данные (без изменений логики)
  const clientBenefits = t.raw("clientBenefits")
  const proBenefits = t.raw("proBenefits")
  const steps = t.raw("steps")

  const faqItems = [
    {
      question: "Как работает charming?",
      answer: "charming соединяет клиентов с салонами красоты и мастерами в сфере бьюти-услуг. Вы можете найти услуги, забронировать время и управлять своими записями онлайн."
    },
    {
      question: "Безопасно ли бронировать онлайн?",
      answer: "Да, все салоны и мастера на нашей платформе проверены и сертифицированы. Мы защищаем ваши личные данные."
    },
    {
      question: "Могу ли я отменить или перенести запись?",
      answer: "Да, вы можете отменить или перенести запись, общаясь с мастером в удобном чате прямо на сайте."
    },
    {
      question: "Какие услуги доступны на платформе?",
      answer: "Мы предлагаем широкий спектр услуг: стрижки, окрашивание, маникюр, педикюр, макияж, массаж, косметологические процедуры и многое другое."
    }
  ]

  const websiteData = {
    name: "charming",
    description: "Find the best beauty salons near you. Book appointments online with verified beauty professionals.",
    url: "https://charming.by"
  }

  const organizationData = {
    name: "charming",
    url: "https://charming.by",
    logo: "https://charming.by/logo.png"
  }

  // Анимации
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  }

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      rotate: [0, 5, -5, 0],
      transition: { duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
    },
  }

  const clientIcons = [Star, ShieldCheck, CalendarCheck, Heart]
  const proIcons = [Users, CalendarCheck, Sparkles, ShieldCheck]
  const stepIcons = [User, Scissors, CalendarCheck, CheckCircle, MessageCircle]

  return (
    <>
      <StructuredData type="WebSite" data={websiteData} />
      <StructuredData type="Organization" data={organizationData} />
      
      <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
        
        {/* Hero Section */}
        {/* min-h-[calc(100vh-64px)] гарантирует, что секция займет весь экран за вычетом хедера */}
        <section className="relative min-h-[calc(100vh-64px)] flex items-center justify-center px-4 bg-gradient-to-b from-white to-rose-50/30">
          
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute top-[10%] left-[5%] w-48 h-48 bg-rose-200/40 rounded-full blur-[80px]"
              variants={floatingVariants}
              animate="animate"
            />
            <motion.div
              className="absolute top-[20%] right-[10%] w-64 h-64 bg-pink-200/40 rounded-full blur-[100px]"
              variants={floatingVariants}
              animate="animate"
              transition={{ delay: 1 }}
            />
          </div>

          <div className="container mx-auto max-w-5xl text-center relative z-10 py-12 md:py-0">
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-rose-100 rounded-full mb-8 shadow-sm"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span className="text-sm font-semibold text-rose-600 tracking-wide uppercase">Charming</span>
            </motion.div>

            <motion.h1
              className="text-4xl sm:text-5xl md:text-7xl font-extrabold mb-6 leading-[1.1] text-gray-900 tracking-tight"
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              {t("heroTitle").split(' ').map((word, i) => (
                 i === 2 ? <span key={i} className="text-rose-600 block sm:inline"> {word} </span> : <span key={i}>{word} </span>
              ))}
            </motion.h1>

            <motion.p
              className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed font-medium"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {t("heroSubtitle")}
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full sm:w-auto"
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <motion.div variants={itemVariants} className="w-full sm:w-auto">
                <Link
                  href="/search"
                  className="group flex items-center justify-center w-full sm:w-auto px-8 py-4 text-lg font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-lg hover:shadow-rose-200/50 transition-all duration-300 transform hover:-translate-y-1"
                >
                  <span>{t("getStartedClient")}</span>
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>

              <motion.div variants={itemVariants} className="w-full sm:w-auto">
                <Link
                  href="/register?pro=1"
                  className="flex items-center justify-center w-full sm:w-auto px-8 py-4 text-lg font-bold text-gray-700 bg-white border-2 border-gray-100 hover:border-rose-200 hover:bg-rose-50 rounded-xl transition-all duration-300"
                >
                  {t("getStartedPro")}
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Преимущества */}
        <section className="py-20 md:py-32 bg-white">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-20"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900">{t("featuresTitle")}</h2>
              <div className="w-20 h-1.5 bg-rose-600 mx-auto rounded-full"></div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
              {/* Карточка Клиента */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={containerVariants}
                className="bg-gray-50 rounded-[2rem] p-8 md:p-12 border border-gray-100 hover:border-rose-100 hover:shadow-xl transition-all duration-500"
              >
                <div className="flex items-center gap-4 mb-10">
                  <div className="p-4 bg-white rounded-2xl shadow-md text-rose-600">
                    <User className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900">{t("clientBenefitsTitle")}</h3>
                </div>
                <ul className="space-y-8">
                  {clientBenefits.map((b: string, i: number) => {
                    const Icon = clientIcons[i] || Star
                    return (
                      <motion.li
                        key={i}
                        className="flex items-start gap-5"
                        variants={itemVariants}
                      >
                        {/* shrink-0 предотвращает сжатие иконки */}
                        <div className="shrink-0 p-2.5 bg-white rounded-xl shadow-sm text-rose-600 mt-0.5">
                          <Icon className="w-6 h-6" />
                        </div>
                        {/* pt-1 выравнивает текст по оптическому центру иконки */}
                        <span className="text-lg text-gray-700 font-medium leading-relaxed pt-1">{b}</span>
                      </motion.li>
                    )
                  })}
                </ul>
              </motion.div>

              {/* Карточка Мастера */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={containerVariants}
                className="bg-gray-900 rounded-[2rem] p-8 md:p-12 shadow-2xl"
              >
                <div className="flex items-center gap-4 mb-10">
                  <div className="p-4 bg-gray-800 rounded-2xl shadow-inner text-rose-400">
                    <Scissors className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold">{t("proBenefitsTitle")}</h3>
                </div>
                <ul className="space-y-8">
                  {proBenefits.map((b: string, i: number) => {
                    const Icon = proIcons[i] || Users
                    return (
                      <motion.li
                        key={i}
                        className="flex items-start gap-5"
                        variants={itemVariants}
                      >
                        <div className="shrink-0 p-2.5 bg-gray-800 rounded-xl text-rose-400 mt-0.5">
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="text-lg text-gray-300 font-medium leading-relaxed pt-1">{b}</span>
                      </motion.li>
                    )
                  })}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Как это работает */}
        <section className="py-20 md:py-32 bg-rose-50/30">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900">{t("howItWorksTitle")}</h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">Простой путь к вашей красоте всего за несколько шагов</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {steps.map((step: string, i: number) => {
                const Icon = stepIcons[i] || CheckCircle
                return (
                  <motion.div
                    key={i}
                    className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col items-center text-center h-full"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={containerVariants}
                    whileHover={{ y: -5 }}
                  >
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-rose-100 rounded-2xl rotate-6 group-hover:rotate-12 transition-transform duration-300"></div>
                      <div className="relative w-16 h-16 bg-white border-2 border-rose-100 rounded-2xl flex items-center justify-center text-rose-600">
                        <Icon className="w-8 h-8" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-900 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {i + 1}
                      </div>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 leading-snug">{step}</h4>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-rose-600">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <motion.div
              className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-br from-white/10 to-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            />
          </div>

          <div className="container mx-auto px-4 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white leading-tight">
                {t("ctaTitle")}
              </h2>
              <p className="text-lg md:text-xl mb-10 text-rose-100 font-medium max-w-2xl mx-auto leading-relaxed">
                {t("ctaDescription")}
              </p>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-10 py-5 text-lg font-bold text-rose-700 bg-white rounded-2xl shadow-2xl hover:bg-gray-50 transition-colors"
                >
                  {t("startNow")}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* FAQ */}
        <div className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl">
             <FAQ items={faqItems} title={t("faqTitle")} className="bg-transparent" />
          </div>
        </div>

        {/* Footer */}
        <footer className="py-12 bg-white border-t border-gray-100">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-600 rounded-lg text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold text-gray-900">Charming</span>
              </div>
              
              <p className="text-gray-500 text-sm md:text-base text-center md:text-right max-w-md">
                {t("footerText")}
              </p>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-100 text-center text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} Charming. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}