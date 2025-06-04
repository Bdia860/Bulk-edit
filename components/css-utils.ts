// Utility functions for CSS handling

/**
 * Format CSS string for better readability
 */
export function formatCss(css: string): string {
  if (!css) return ""

  try {
    // Simple CSS formatter
    return css
      .replace(/\s*{\s*/g, " {\n  ")
      .replace(/\s*;\s*/g, ";\n  ")
      .replace(/\s*}\s*/g, "\n}\n\n")
      .replace(/\n {2}\n/g, "\n")
      .trim()
  } catch (error) {
    console.error("Error formatting CSS:", error)
    return css
  }
}

/**
 * Extract CSS properties from a CSS string
 */
export function extractCssProperties(css: string): Record<string, string> {
  const properties: Record<string, string> = {}

  try {
    // Extract properties from a simple CSS string
    const matches = css.match(/([a-zA-Z-]+)\s*:\s*([^;]+);/g)
    if (matches) {
      matches.forEach((match) => {
        const [property, value] = match.split(":").map((s) => s.trim())
        if (property && value) {
          properties[property] = value.replace(/;$/, "")
        }
      })
    }
  } catch (error) {
    console.error("Error extracting CSS properties:", error)
  }

  return properties
}

/**
 * Validate CSS syntax
 */
export function validateCss(css: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  try {
    // Simple validation
    const braceCount = (css.match(/{/g) || []).length
    const closingBraceCount = (css.match(/}/g) || []).length

    if (braceCount !== closingBraceCount) {
      errors.push(`Mismatched braces: ${braceCount} opening vs ${closingBraceCount} closing`)
    }

    // Check for missing semicolons
    const declarations = css.match(/{([^{}]*)}/g) || []
    declarations.forEach((declaration) => {
      const props = declaration.replace(/[{}]/g, "").split(";").filter(Boolean)
      props.forEach((prop) => {
        if (!prop.includes(":")) {
          errors.push(`Missing colon in declaration: "${prop.trim()}"`)
        }
      })
    })
  } catch (error) {
    console.error("Error validating CSS:", error)
    errors.push("An error occurred during validation")
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Minify CSS by removing whitespace and comments
 */
export function minifyCss(css: string): string {
  if (!css) return ""

  try {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, "") // Remove comments
      .replace(/\s+/g, " ") // Replace multiple spaces with a single space
      .replace(/\s*{\s*/g, "{") // Remove spaces around opening braces
      .replace(/\s*}\s*/g, "}") // Remove spaces around closing braces
      .replace(/\s*;\s*/g, ";") // Remove spaces around semicolons
      .replace(/\s*:\s*/g, ":") // Remove spaces around colons
      .trim()
  } catch (error) {
    console.error("Error minifying CSS:", error)
    return css
  }
}

/**
 * Apply CSS to a specific element or document
 */
export function applyCssToElement(css: string, elementId: string): boolean {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      console.error(`Element with ID "${elementId}" not found`)
      return false
    }

    // Apply CSS to the element
    element.style.cssText = css
    return true
  } catch (error) {
    console.error("Error applying CSS to element:", error)
    return false
  }
}
