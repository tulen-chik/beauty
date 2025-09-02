"use client"

import { motion } from "framer-motion"
import {
  Scissors,
  Star,
  CalendarCheck,
  User,
  Users,
  ShieldCheck,
  Heart,
  Sparkles,
  CheckCircle,
  MessageCircle,
} from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import StructuredData from "@/components/StructuredData"
import FAQ from "@/components/FAQ"

export default function Home() {
  const t = useTranslations("home")

  // Преимущества для клиентов и мастеров
  const clientBenefits = t.raw("clientBenefits")
  const proBenefits = t.raw("proBenefits")
  const steps = t.raw("steps")

  // FAQ данные
  const faqItems = [
    {
      question: "Как работает Beauty Platform?",
      answer: "Beauty Platform соединяет клиентов с салонами красоты и мастерами в сфере бьюти-услуг. Вы можете найти услуги, забронировать время и управлять своими записями онлайн."
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

  // Структурированные данные для SEO
  const websiteData = {
    name: "Beauty Platform",
    description: "Find the best beauty salons near you. Book appointments online with verified beauty professionals.",
    url: "https://beauty-platform.com"
  }

  const organizationData = {
    name: "Beauty Platform",
    url: "https://beauty-platform.com",
    logo: "https://beauty-platform.com/logo.png"
  }

  // Анимации
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  }

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 6,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      },
    },
  }

  // Иконки для преимуществ
  const clientIcons = [Star, ShieldCheck, CalendarCheck, Heart]
  const proIcons = [Users, CalendarCheck, Sparkles, ShieldCheck]
  const stepIcons = [User, Scissors, CalendarCheck, CheckCircle, MessageCircle]

  return (
    <>
      <StructuredData type="WebSite" data={websiteData} />
      <StructuredData type="Organization" data={organizationData} />
      
      <div className="min-h-screen bg-white text-gray-900">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-4 bg-white">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-20 left-10 w-32 h-32 bg-rose-100/60 rounded-full blur-3xl"
            variants={floatingVariants}
            animate="animate"
          />
          <motion.div
            className="absolute top-40 right-20 w-24 h-24 bg-pink-100/60 rounded-full blur-2xl"
            variants={floatingVariants}
            animate="animate"
            transition={{ delay: 1 }}
          />
          <motion.div
            className="absolute bottom-32 left-1/4 w-20 h-20 bg-rose-100/40 rounded-full blur-xl"
            variants={floatingVariants}
            animate="animate"
            transition={{ delay: 2 }}
          />
        </div>

        <div className="container mx-auto max-w-6xl text-center relative z-10">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-200 rounded-full mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Sparkles className="w-4 h-4 text-rose-600" />
            <span className="text-sm font-semibold text-rose-700 tracking-wide">Beauty Platform</span>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight text-gray-900"
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <span className="text-rose-600">{t("heroTitle")}</span>
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto font-normal leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            {t("heroSubtitle")}
          </motion.p>

          <motion.p
            className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            {t("mission")}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/register"
                className="group inline-flex items-center justify-center px-12 py-4 text-lg font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <span className="mr-2">{t("getStartedClient")}</span>
                <motion.div
                  className="w-5 h-5"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                >
                  →
                </motion.div>
              </Link>
            </motion.div>

            <motion.div variants={itemVariants} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/register?pro=1"
                className="inline-flex items-center justify-center px-12 py-4 text-lg font-semibold text-rose-700 bg-white border-2 border-rose-600 hover:bg-rose-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {t("getStartedPro")}
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Преимущества */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">{t("featuresTitle")}</h2>
            <div className="w-24 h-1 bg-rose-600 mx-auto rounded-full"></div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Для клиентов */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              variants={containerVariants}
              className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-500 border border-gray-100"
            >
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-rose-600 rounded-2xl shadow-lg">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{t("clientBenefitsTitle")}</h3>
                </div>
                <ul className="space-y-6">
                  {clientBenefits.map((b: string, i: number) => {
                    const Icon = clientIcons[i] || Star
                    return (
                      <motion.li
                        key={i}
                        className="flex items-start gap-4 text-lg text-gray-700"
                        variants={itemVariants}
                      >
                        <div className="p-2 bg-rose-100 rounded-xl mt-1 flex-shrink-0">
                          <Icon className="w-5 h-5 text-rose-600" />
                        </div>
                        <span className="leading-relaxed font-medium">{b}</span>
                      </motion.li>
                    )
                  })}
                </ul>
              </div>
            </motion.div>

            {/* Для мастеров */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              variants={containerVariants}
              className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-500 border border-gray-100"
            >
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-pink-600 rounded-2xl shadow-lg">
                    <Scissors className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{t("proBenefitsTitle")}</h3>
                </div>
                <ul className="space-y-6">
                  {proBenefits.map((b: string, i: number) => {
                    const Icon = proIcons[i] || Users
                    return (
                      <motion.li
                        key={i}
                        className="flex items-start gap-4 text-lg text-gray-700"
                        variants={itemVariants}
                      >
                        <div className="p-2 bg-pink-100 rounded-xl mt-1 flex-shrink-0">
                          <Icon className="w-5 h-5 text-pink-600" />
                        </div>
                        <span className="leading-relaxed font-medium">{b}</span>
                      </motion.li>
                    )
                  })}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Как это работает */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">{t("howItWorksTitle")}</h2>
            <div className="w-24 h-1 bg-rose-600 mx-auto rounded-full"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {steps.map((step: string, i: number) => {
              const Icon = stepIcons[i] || CheckCircle
              return (
                <motion.div
                  key={i}
                  className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 border border-gray-100 text-center"
                  initial="hidden"
                  whileInView="visible"
                  variants={containerVariants}
                  whileHover={{ y: -8, scale: 1.02 }}
                >
                  <div className="relative z-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-600 rounded-2xl shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-sm font-bold text-rose-600 mb-2 tracking-wide">ШАГ {i + 1}</div>
                    <span className="text-base text-gray-800 font-semibold leading-relaxed">{step}</span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-rose-600 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0">
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)",
                "radial-gradient(circle at 80% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)",
                "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)",
              ],
            }}
            transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-8 text-white"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            {t("ctaTitle")}
          </motion.h2>

          <motion.p
            className="text-xl mb-12 max-w-3xl mx-auto leading-relaxed text-rose-100 font-medium"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            {t("ctaDescription")}
          </motion.p>

          <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-12 py-4 text-lg font-semibold text-rose-700 bg-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:bg-gray-50"
            >
              <span className="mr-2">{t("startNow")}</span>
              <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}>
                →
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <FAQ items={faqItems} title={t("faqTitle")} className="bg-gray-100" />

      {/* Footer */}
      <footer className="py-16 bg-gray-900">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-rose-600 rounded-xl text-white">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold">Beauty Platform</span>
            </div>
            <p className="text-gray-400 text-lg leading-relaxed max-w-2xl font-medium">{t("footerText")}</p>
            <div className="w-16 h-1 bg-rose-600 rounded-full mt-4"></div>
          </motion.div>
        </div>
      </footer>
    </div>
    </>
  )
}
