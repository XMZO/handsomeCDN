// 硬件加速检测与提示系统
// 用于检测浏览器硬件加速问题并向用户提供建议

/**
 * 检测浏览器硬件加速潜在问题
 * @param {function} callback - 结果回调函数
 */
function checkPotentialHardwareAccelerationIssue(callback) {
    let result = {
        issueDetected: false,
        reason: "未知原因 (Unknown)",
        details: "",
        browserInfo: navigator.userAgent
    };

    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

        if (!gl) {
            result.issueDetected = true;
            result.reason = "WebGL上下文创建失败 (WebGL context creation failed)";
            result.details = "浏览器可能不支持WebGL，或者图形驱动存在问题。";
            callback(result);
            return;
        }

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            result.details = `WebGL Renderer: ${renderer}, Vendor: ${vendor}`;

            // 常见硬件制造商关键词
            const hardwareVendors = [
                "intel", "nvidia", "amd", "radeon", "geforce", "iris", 
                "vmware", "virgl", "mali", "adreno", "apple", "m1", "m2", "m3"
            ];
            
            // 更精确识别软件渲染器
            const definitiveSoftwareRenderers = [
                "swiftshader", // Google SwiftShader
                "llvmpipe",    // Mesa LLVMpipe
                "microsoft basic render driver", // Windows 软件回退
                "software rasterizer",
                "software"    // 明确标识为软件渲染
            ];
            
            let isSoftwareRenderer = false;
            let rendererLowerCase = "";
            
            if (renderer) {
                rendererLowerCase = renderer.toLowerCase();
                
                // 首先检查明确的软件渲染器
                for (const sr of definitiveSoftwareRenderers) {
                    if (rendererLowerCase.includes(sr)) {
                        isSoftwareRenderer = true;
                        result.reason = `检测到软件渲染器: ${sr} (Software renderer detected)`;
                        break;
                    }
                }
                
                // 如果不是明确的软件渲染器，进行更复杂的判断
                if (!isSoftwareRenderer) {
                    // ANGLE 判断逻辑：仅当同时包含angle且不包含硬件厂商标识，或包含明确的软件回退标识时，才判定为可能的软件渲染
                    if (rendererLowerCase.includes("angle")) {
                        if (rendererLowerCase.includes("warp") || 
                            rendererLowerCase.includes("pseudo-warp") || 
                            rendererLowerCase.includes("d3d9")) {
                            isSoftwareRenderer = true;
                            result.reason = "检测到ANGLE软件渲染模式 (ANGLE software rendering mode detected)";
                        } else {
                            // 检查是否同时没有包含任何已知硬件厂商标识
                            let hasHardwareVendor = false;
                            for (const vendor of hardwareVendors) {
                                if (rendererLowerCase.includes(vendor)) {
                                    hasHardwareVendor = true;
                                    break;
                                }
                            }
                            
                            if (!hasHardwareVendor) {
                                // 可能是软件渲染，但不太确定
                                isSoftwareRenderer = true;
                                result.reason = "可能使用ANGLE软件渲染 (Possible ANGLE software rendering)";
                            }
                        }
                    }
                    
                    // Mesa 判断逻辑：仅当包含mesa且不包含硬件厂商标识时，才可能是软件渲染
                    if (rendererLowerCase.includes("mesa")) {
                        let hasHardwareVendor = false;
                        for (const vendor of hardwareVendors) {
                            if (rendererLowerCase.includes(vendor)) {
                                hasHardwareVendor = true;
                                break;
                            }
                        }
                        
                        if (!hasHardwareVendor) {
                            isSoftwareRenderer = true;
                            result.reason = "可能使用Mesa软件渲染 (Possible Mesa software rendering)";
                        }
                    }
                }
                
                // 设置检测结果
                if (isSoftwareRenderer) {
                    result.issueDetected = true;
                }
            }
        } else {
            result.details = "无法获取WEBGL_debug_renderer_info扩展 (Could not get WEBGL_debug_renderer_info extension)";
        }

        // 如果基于WebGL的检测没有明确发现问题，补充2D Canvas性能测试
        if (!result.issueDetected) {
            const startTime = performance.now();
            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = 200;
            offscreenCanvas.height = 200;
            const ctx = offscreenCanvas.getContext('2d');
            if (ctx) {
                for (let i = 0; i < 10000; i++) {
                    ctx.fillRect((i*5) % 200, (i*3) % 200, 2, 2);
                }
                const duration = performance.now() - startTime;
                result.details += ` | 2D Canvas测试耗时: ${duration.toFixed(2)}ms`;
                
                // 根据浏览器类型调整阈值
                let threshold = 200; // 默认阈值
                const ua = navigator.userAgent.toLowerCase();
                
                if (ua.includes("firefox")) {
                    threshold = 300; // Firefox通常较慢
                } else if (ua.includes("safari") && !ua.includes("chrome")) {
                    threshold = 250; // Safari
                } else if (ua.includes("edge")) {
                    threshold = 220; // Edge
                }
                
                if (duration > threshold) {
                    result.issueDetected = true;
                    result.reason = `2D Canvas渲染较慢 (${duration.toFixed(0)}ms > ${threshold}ms)`;
                }
            }
        }
    } catch (e) {
        result.issueDetected = true;
        result.reason = "检测过程中发生错误 (Error during detection)";
        result.details = e.message;
        console.error("硬件加速检测错误:", e);
    }

    callback(result);
}

/**
 * 显示硬件加速提示
 * @param {Object} details - 检测结果详情
 */
function showHardwareAccelerationPrompt(details) {
    // 避免重复提示
    if (sessionStorage.getItem('hardwareAccelerationPromptShown')) {
        return;
    }

    // 移除可能已存在的提示框
    const existingPrompt = document.getElementById('hardware-accel-prompt');
    if (existingPrompt) {
        existingPrompt.remove();
    }

    const promptDiv = document.createElement('div');
    promptDiv.id = 'hardware-accel-prompt';
    promptDiv.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background-color: #ffffe0;
        border: 1px solid #ccc;
        padding: 15px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 1000000; /* 确保在最上层 */
        font-family: sans-serif;
        font-size: 14px;
        max-width: 350px;
        color: #333;
    `;

    promptDiv.innerHTML = `
        <p><strong>性能提示：</strong></p>
        <p>为了获得最佳的浏览体验，建议您开启浏览器的硬件加速功能。</p>
        <p>若已开启但仍感觉卡顿，可能是由于当前检测到：${details.reason}。</p>
        <p><small>通常可以在浏览器设置的"系统"或"高级"选项中找到硬件加速设置。</small></p>
        <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 5px; margin-top: 10px;">
            <button id="close-hw-prompt" style="padding: 5px 10px; background: #f0f0f0; border: 1px solid #ccc; border-radius: 3px; cursor: pointer;">知道了</button>
            <button id="dont-show-hw-prompt" style="padding: 5px 10px; background: #f0f0f0; border: 1px solid #ccc; border-radius: 3px; cursor: pointer;">不再显示</button>
            <button id="recheck-hw-prompt" style="padding: 5px 10px; background: #f0f0f0; border: 1px solid #ccc; border-radius: 3px; cursor: pointer;">重新检测</button>
        </div>
        <details style="margin-top: 10px; font-size: 12px; color: #666;">
            <summary>详细信息</summary>
            <p style="word-break: break-word;">${details.details}</p>
            <p>浏览器: ${details.browserInfo}</p>
        </details>
    `;

    document.body.appendChild(promptDiv);

    document.getElementById('close-hw-prompt').addEventListener('click', () => {
        promptDiv.remove();
        sessionStorage.setItem('hardwareAccelerationPromptShown', 'true');
    });
    
    document.getElementById('dont-show-hw-prompt').addEventListener('click', () => {
        promptDiv.remove();
        localStorage.setItem('hardwareAccelerationPromptDisabled', 'true');
        sessionStorage.setItem('hardwareAccelerationPromptShown', 'true');
    });
    
    document.getElementById('recheck-hw-prompt').addEventListener('click', () => {
        promptDiv.remove();
        sessionStorage.removeItem('hardwareAccelerationPromptShown');
        // 清除会话临时状态，但保留长期设置
        runHardwareAccelerationCheck();
    });
}

/**
 * 运行硬件加速检测
 */
function runHardwareAccelerationCheck() {
    checkPotentialHardwareAccelerationIssue((result) => {
        console.log("硬件加速检测结果:", result);
        if (result.issueDetected) {
            showHardwareAccelerationPrompt(result);
        }
    });
}

/**
 * 初始化硬件加速检测
 */
function initHardwareAccelerationCheck() {
    // 检查是否已禁用提示
    if (localStorage.getItem('hardwareAccelerationPromptDisabled')) {
        return;
    }
    
    // 添加全局API，允许外部代码触发检测
    window.checkHardwareAcceleration = runHardwareAccelerationCheck;
    
    // 页面加载完成后执行检测
    window.addEventListener('load', () => {
        // 延迟执行检测，避免影响页面初始加载性能
        setTimeout(runHardwareAccelerationCheck, 1000);
    });
}

// 初始化检测
initHardwareAccelerationCheck();